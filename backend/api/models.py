from django.db import models
from django.utils import timezone


class Position(models.Model):
    """Represents a voting position"""
    POSITION_CHOICES = [
        ('team_lead', 'Team Lead'),
        ('program_coordinator', 'Program Coordinator'),
        ('secretary', 'Secretary'),
        ('treasurer', 'Treasurer'),
    ]
    
    name = models.CharField(max_length=50, choices=POSITION_CHOICES, unique=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return self.get_name_display()


class Voter(models.Model):
    """Represents a registered voter"""
    full_name = models.CharField(max_length=200)
    first_name = models.CharField(max_length=100, unique=True)
    allowed = models.BooleanField(default=True)
    has_voted = models.BooleanField(default=False)
    device_hash = models.CharField(max_length=256, null=True, blank=True)
    voted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['full_name']
    
    def __str__(self):
        return self.full_name


class Candidate(models.Model):
    """Represents a candidate eligible to contest"""
    full_name = models.CharField(max_length=200)
    image = models.ImageField(upload_to='candidates/', null=True, blank=True)
    eligible = models.BooleanField(default=True)
    positions = models.ManyToManyField(Position, related_name='candidates')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['full_name']
    
    def __str__(self):
        return self.full_name


class Vote(models.Model):
    """Represents a single vote"""
    voter = models.ForeignKey(Voter, on_delete=models.CASCADE, related_name='votes')
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='votes')
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes_received')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('voter', 'position')
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.voter.full_name} -> {self.candidate.full_name} for {self.position}"


class SystemState(models.Model):
    """Singleton model to manage voting state"""
    voting_open = models.BooleanField(default=True)
    results_released = models.BooleanField(default=False)
    voting_closed_at = models.DateTimeField(null=True, blank=True)
    results_released_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name_plural = "System State"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_state(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    def __str__(self):
        return f"Voting Open: {self.voting_open} | Results Released: {self.results_released}"


class FinalResult(models.Model):
    """Stores the final results after conflict resolution"""
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='final_results')
    winner = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='wins')
    vote_count = models.IntegerField()
    resolved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('position', 'winner')
        ordering = ['position']
    
    def __str__(self):
        return f"{self.position}: {self.winner.full_name} ({self.vote_count} votes)"
