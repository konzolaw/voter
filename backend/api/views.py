from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Position, Voter, Candidate, Vote, SystemState, FinalResult
from .serializers import (
    PositionSerializer, VoterSerializer, CandidateSerializer, 
    VoteSerializer, SystemStateSerializer, FinalResultSerializer,
    VotingSubmissionSerializer
)


class PositionViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for positions"""
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [AllowAny]


class CandidateViewSet(viewsets.ModelViewSet):
    """API endpoint for candidates"""
    queryset = Candidate.objects.filter(eligible=True).prefetch_related('positions')
    serializer_class = CandidateSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def add_candidate(self, request):
        """Add a new candidate"""
        full_name = request.data.get('full_name', '').strip()
        
        if not full_name:
            return Response(
                {'error': 'Full name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if candidate already exists
        if Candidate.objects.filter(full_name__iexact=full_name).exists():
            return Response(
                {'error': 'Candidate with this name already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create candidate eligible for all positions
        candidate = Candidate.objects.create(
            full_name=full_name,
            eligible=True
        )
        candidate.positions.set(Position.objects.all())
        
        return Response(
            CandidateSerializer(candidate).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['delete'])
    def remove_candidate(self, request, pk=None):
        """Remove a candidate"""
        try:
            candidate = Candidate.objects.get(pk=pk)
            
            # Check if candidate has received any votes
            if Vote.objects.filter(candidate=candidate).exists():
                return Response(
                    {'error': 'Cannot delete candidate who has received votes'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            candidate_name = candidate.full_name
            candidate.delete()
            
            return Response(
                {'message': f'Candidate {candidate_name} removed successfully'},
                status=status.HTTP_200_OK
            )
        except Candidate.DoesNotExist:
            return Response(
                {'error': 'Candidate not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class VoterViewSet(viewsets.ModelViewSet):
    """API endpoint for voters (admin only for listing)"""
    queryset = Voter.objects.all()
    serializer_class = VoterSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def add_voter(self, request):
        """Add a new voter"""
        full_name = request.data.get('full_name', '').strip()
        
        if not full_name:
            return Response(
                {'error': 'Full name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if voter already exists
        if Voter.objects.filter(full_name__iexact=full_name).exists():
            return Response(
                {'error': 'Voter with this name already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract first name
        first_name = full_name.split()[0].strip().capitalize()
        
        voter = Voter.objects.create(
            full_name=full_name,
            first_name=first_name,
            allowed=True,
            has_voted=False
        )
        
        return Response(
            VoterSerializer(voter).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['delete'])
    def remove_voter(self, request, pk=None):
        """Remove a voter"""
        try:
            voter = Voter.objects.get(pk=pk)
            
            # Don't allow deleting if they've already voted
            if voter.has_voted:
                return Response(
                    {'error': 'Cannot delete voter who has already voted'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            voter_name = voter.full_name
            voter.delete()
            
            return Response(
                {'message': f'Voter {voter_name} removed successfully'},
                status=status.HTTP_200_OK
            )
        except Voter.DoesNotExist:
            return Response(
                {'error': 'Voter not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def verify_voter(self, request):
        """Verify if a voter can vote"""
        full_name = request.data.get('full_name', '').strip()
        device_hash = request.data.get('device_hash', '')
        
        if not full_name:
            return Response(
                {'error': 'Full name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check voting state
        system_state = SystemState.get_state()
        if not system_state.voting_open:
            return Response(
                {'error': 'Voting is currently closed'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Extract names from input
        input_names = set(name.strip().lower() for name in full_name.split())
        
        # Find voter by matching any name
        voter = None
        for v in Voter.objects.filter(allowed=True):
            voter_names = set(name.strip().lower() for name in v.full_name.split())
            if input_names & voter_names:  # If any name matches
                voter = v
                break
        
        if not voter:
            return Response(
                {'error': 'You are not registered to vote'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not voter.allowed:
            return Response(
                {'error': 'You are not allowed to vote'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if voter.has_voted:
            return Response(
                {'error': 'You have already voted'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check device hash
        if voter.device_hash and voter.device_hash != device_hash:
            return Response(
                {'error': 'You must use the same device you started with'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            'voter_id': voter.id,
            'full_name': voter.full_name,
            'can_vote': True
        })


@api_view(['POST'])
def submit_votes(request):
    """Submit all votes at once"""
    serializer = VotingSubmissionSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    full_name = serializer.validated_data['full_name']
    device_hash = serializer.validated_data['device_hash']
    votes_data = serializer.validated_data['votes']
    
    # Check voting state
    system_state = SystemState.get_state()
    if not system_state.voting_open:
        return Response(
            {'error': 'Voting is currently closed'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Find voter by matching any name
    input_names = set(name.strip().lower() for name in full_name.split())
    voter = None
    for v in Voter.objects.filter(allowed=True):
        voter_names = set(name.strip().lower() for name in v.full_name.split())
        if input_names & voter_names:
            voter = v
            break
    
    if not voter:
        return Response(
            {'error': 'Voter not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if voter.has_voted:
        return Response(
            {'error': 'You have already voted'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validate all votes before submission
    position_ids = set()
    for vote_data in votes_data:
        position_id = vote_data.get('position_id')
        candidate_id = vote_data.get('candidate_id')
        
        if position_id in position_ids:
            return Response(
                {'error': 'Duplicate position in votes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        position_ids.add(position_id)
        
        # Verify position exists
        try:
            position = Position.objects.get(id=position_id)
        except Position.DoesNotExist:
            return Response(
                {'error': f'Position {position_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify candidate exists and is eligible
        try:
            candidate = Candidate.objects.get(id=candidate_id, eligible=True)
        except Candidate.DoesNotExist:
            return Response(
                {'error': f'Candidate {candidate_id} not found or not eligible'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify candidate is eligible for this position
        if not candidate.positions.filter(id=position_id).exists():
            return Response(
                {'error': f'Candidate {candidate.full_name} is not eligible for {position}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Check we have exactly 4 votes
    if len(votes_data) != 4:
        return Response(
            {'error': 'You must vote for all 4 positions'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Submit all votes in a transaction
    try:
        with transaction.atomic():
            # Create votes
            for vote_data in votes_data:
                Vote.objects.create(
                    voter=voter,
                    position_id=vote_data['position_id'],
                    candidate_id=vote_data['candidate_id']
                )
            
            # Update voter
            voter.has_voted = True
            voter.voted_at = timezone.now()
            if not voter.device_hash:
                voter.device_hash = device_hash
            voter.save()
        
        return Response({
            'success': True,
            'message': 'Your votes have been recorded successfully'
        })
    
    except Exception as e:
        return Response(
            {'error': f'Failed to submit votes: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def system_state(request):
    """Get current system state"""
    state = SystemState.get_state()
    serializer = SystemStateSerializer(state)
    return Response(serializer.data)


@api_view(['POST'])
def close_voting(request):
    """Close voting (admin only)"""
    state = SystemState.get_state()
    
    if not state.voting_open:
        return Response(
            {'error': 'Voting is already closed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    state.voting_open = False
    state.voting_closed_at = timezone.now()
    state.save()
    
    return Response({
        'success': True,
        'message': 'Voting has been closed',
        'closed_at': state.voting_closed_at
    })


@api_view(['POST'])
def restart_voting(request):
    """Restart voting - deletes all votes and resets voter states (admin only)"""
    try:
        with transaction.atomic():
            # Delete all votes
            vote_count = Vote.objects.count()
            Vote.objects.all().delete()
            
            # Delete all final results
            FinalResult.objects.all().delete()
            
            # Reset all voters
            voter_count = Voter.objects.filter(has_voted=True).count()
            Voter.objects.update(
                has_voted=False,
                voted_at=None,
                device_hash=None
            )
            
            # Reset system state
            state = SystemState.get_state()
            state.voting_open = True
            state.results_released = False
            state.voting_closed_at = None
            state.results_released_at = None
            state.save()
            
            return Response({
                'success': True,
                'message': 'Voting system has been restarted',
                'votes_deleted': vote_count,
                'voters_reset': voter_count
            })
    except Exception as e:
        return Response(
            {'error': f'Failed to restart voting: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def release_results(request):
    """Release results with conflict resolution (admin only)"""
    state = SystemState.get_state()
    
    if state.voting_open:
        return Response(
            {'error': 'Cannot release results while voting is still open'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if state.results_released:
        return Response(
            {'error': 'Results have already been released'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Run conflict resolution
    try:
        with transaction.atomic():
            # Clear previous final results
            FinalResult.objects.all().delete()
            
            # Get vote counts for each position
            position_results = {}
            for position in Position.objects.all():
                vote_counts = Vote.objects.filter(position=position).values('candidate').annotate(
                    count=Count('candidate')
                ).order_by('-count')
                
                position_results[position.id] = [
                    {'candidate_id': vc['candidate'], 'count': vc['count']}
                    for vc in vote_counts
                ]
            
            # Conflict resolution algorithm
            winners = {}  # position_id -> (candidate_id, vote_count)
            assigned_candidates = set()
            
            # Sort positions by highest vote difference to prioritize strong wins
            position_priority = []
            for pos_id, results in position_results.items():
                if len(results) >= 2:
                    diff = results[0]['count'] - results[1]['count']
                else:
                    diff = results[0]['count'] if results else 0
                position_priority.append((pos_id, diff))
            
            position_priority.sort(key=lambda x: x[1], reverse=True)
            
            # Assign winners, handling conflicts
            for pos_id, _ in position_priority:
                results = position_results[pos_id]
                
                # Find first candidate not already assigned
                for result in results:
                    candidate_id = result['candidate_id']
                    if candidate_id not in assigned_candidates:
                        winners[pos_id] = (candidate_id, result['count'])
                        assigned_candidates.add(candidate_id)
                        break
            
            # Save final results
            for pos_id, (candidate_id, count) in winners.items():
                FinalResult.objects.create(
                    position_id=pos_id,
                    winner_id=candidate_id,
                    vote_count=count
                )
            
            # Update system state
            state.results_released = True
            state.results_released_at = timezone.now()
            state.save()
        
        return Response({
            'success': True,
            'message': 'Results have been released',
            'released_at': state.results_released_at
        })
    
    except Exception as e:
        return Response(
            {'error': f'Failed to release results: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_results(request):
    """Get final results"""
    state = SystemState.get_state()
    
    if not state.results_released:
        return Response({
            'released': False,
            'message': 'Results have not been released yet'
        })
    
    results = FinalResult.objects.select_related('position', 'winner').all()
    serializer = FinalResultSerializer(results, many=True)
    
    return Response({
        'released': True,
        'results': serializer.data
    })


@api_view(['GET'])
def voting_stats(request):
    """Get voting statistics (admin only)"""
    total_voters = Voter.objects.filter(allowed=True).count()
    voted_count = Voter.objects.filter(has_voted=True).count()
    
    # Get vote breakdown by position
    position_breakdown = []
    for position in Position.objects.all():
        vote_counts = Vote.objects.filter(position=position).values(
            'candidate__full_name'
        ).annotate(count=Count('candidate')).order_by('-count')
        
        position_breakdown.append({
            'position': position.get_name_display(),
            'votes': list(vote_counts)
        })
    
    return Response({
        'total_voters': total_voters,
        'voted_count': voted_count,
        'pending_count': total_voters - voted_count,
        'turnout_percentage': round((voted_count / total_voters * 100) if total_voters > 0 else 0, 2),
        'position_breakdown': position_breakdown
    })
