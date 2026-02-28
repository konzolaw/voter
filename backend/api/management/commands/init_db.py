from django.core.management.base import BaseCommand
from api.models import Position, Voter, Candidate


class Command(BaseCommand):
    help = 'Initialize database with positions, voters, and candidates'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting database initialization...')
        
        # Create positions
        positions_data = [
            {
                'name': 'team_lead',
                'description': 'Overall leader of the Reign City Security Team. Answerable to the patron. Oversees all other leads and acts as operations manager for indoor and outdoor activities.'
            },
            {
                'name': 'program_coordinator',
                'description': 'Responsible for organizing events, coordinating programs, and ensuring smooth execution of team activities.'
            },
            {
                'name': 'secretary',
                'description': 'Performs secretariat functions including documentation, assisting discussions, and supporting internal voting processes.'
            },
            {
                'name': 'treasurer',
                'description': 'Responsible for financial oversight, budget generation, advisory on spending, safe keeping of funds, and ensuring financial discipline.'
            }
        ]
        
        self.stdout.write('Creating positions...')
        positions = {}
        for pos_data in positions_data:
            position, created = Position.objects.get_or_create(
                name=pos_data['name'],
                defaults={'description': pos_data['description']}
            )
            positions[pos_data['name']] = position
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created position: {position}'))
            else:
                self.stdout.write(f'  Position already exists: {position}')
        
        # All 25 voters
        voters_data = [
            "Konzolo", "Fortunate", "Teddy", "Mumbi", "Phinehas", "Mercy",
            "Terrence", "Trevor", "Ricardo", "Anitah", "Wesley", "Clinton",
            "Dad Ndichu", "Nancy", "Love", "Hope", "Brandon", "Enock",
            "Judah", "Denno", "Vishal", "Aswani", "Allan", "Chris", "Panai"
        ]
        
        self.stdout.write('Creating voters...')
        for full_name in voters_data:
            # Extract first name
            first_name = full_name.split()[0].strip().capitalize()
            
            voter, created = Voter.objects.get_or_create(
                first_name=first_name,
                defaults={
                    'full_name': full_name,
                    'allowed': True,
                    'has_voted': False
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created voter: {voter.full_name}'))
            else:
                self.stdout.write(f'  Voter already exists: {voter.full_name}')
        
        # 12 eligible candidates
        candidates_data = [
            "Konzolo", "Fortunate", "Teddy", "Mumbi", "Phinehas", "Mercy",
            "Terrence", "Trevor", "Ricardo", "Anitah", "Wesley", "Clinton"
        ]
        
        self.stdout.write('Creating candidates...')
        all_positions = list(positions.values())
        
        for full_name in candidates_data:
            candidate, created = Candidate.objects.get_or_create(
                full_name=full_name,
                defaults={'eligible': True}
            )
            
            if created:
                # Add all 4 positions to this candidate
                candidate.positions.set(all_positions)
                self.stdout.write(self.style.SUCCESS(f'  Created candidate: {candidate.full_name} (eligible for all positions)'))
            else:
                self.stdout.write(f'  Candidate already exists: {candidate.full_name}')
        
        self.stdout.write(self.style.SUCCESS('\n✓ Database initialization complete!'))
        self.stdout.write(f'  Positions: {Position.objects.count()}')
        self.stdout.write(f'  Voters: {Voter.objects.count()}')
        self.stdout.write(f'  Candidates: {Candidate.objects.count()}')
