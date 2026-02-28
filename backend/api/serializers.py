from rest_framework import serializers
from .models import Position, Voter, Candidate, Vote, SystemState, FinalResult


class PositionSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Position
        fields = ['id', 'name', 'display_name', 'description', 'created_at']


class VoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voter
        fields = ['id', 'full_name', 'first_name', 'allowed', 'has_voted', 'device_hash', 'voted_at']
        read_only_fields = ['has_voted', 'device_hash', 'voted_at']


class CandidateSerializer(serializers.ModelSerializer):
    positions = PositionSerializer(many=True, read_only=True)
    position_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Position.objects.all(), 
        source='positions', 
        write_only=True
    )
    
    class Meta:
        model = Candidate
        fields = ['id', 'full_name', 'image', 'eligible', 'positions', 'position_ids', 'created_at']


class VoteSerializer(serializers.ModelSerializer):
    voter_name = serializers.CharField(source='voter.full_name', read_only=True)
    position_name = serializers.CharField(source='position.get_name_display', read_only=True)
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    
    class Meta:
        model = Vote
        fields = ['id', 'voter', 'voter_name', 'position', 'position_name', 'candidate', 'candidate_name', 'timestamp']
        read_only_fields = ['timestamp']


class SystemStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemState
        fields = ['voting_open', 'results_released', 'voting_closed_at', 'results_released_at']
        read_only_fields = ['voting_closed_at', 'results_released_at']


class FinalResultSerializer(serializers.ModelSerializer):
    position = PositionSerializer(read_only=True)
    winner = CandidateSerializer(read_only=True)
    
    class Meta:
        model = FinalResult
        fields = ['id', 'position', 'winner', 'vote_count', 'resolved_at']


class VotingSubmissionSerializer(serializers.Serializer):
    """Serializer for submitting all votes at once"""
    full_name = serializers.CharField(max_length=200)
    device_hash = serializers.CharField(max_length=256)
    votes = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        ),
        min_length=4,
        max_length=4
    )
    # votes format: [{"position_id": 1, "candidate_id": 3}, ...]
