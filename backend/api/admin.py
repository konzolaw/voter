from django.contrib import admin
from .models import Position, Voter, Candidate, Vote, SystemState, FinalResult


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Voter)
class VoterAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'first_name', 'allowed', 'has_voted', 'voted_at')
    list_filter = ('allowed', 'has_voted')
    search_fields = ('full_name', 'first_name')
    readonly_fields = ('voted_at', 'device_hash')


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'eligible', 'created_at')
    list_filter = ('eligible',)
    filter_horizontal = ('positions',)
    search_fields = ('full_name',)


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ('voter', 'position', 'candidate', 'timestamp')
    list_filter = ('position', 'timestamp')
    search_fields = ('voter__full_name', 'candidate__full_name')
    readonly_fields = ('timestamp',)
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SystemState)
class SystemStateAdmin(admin.ModelAdmin):
    list_display = ('voting_open', 'results_released', 'voting_closed_at', 'results_released_at')
    readonly_fields = ('voting_closed_at', 'results_released_at')
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(FinalResult)
class FinalResultAdmin(admin.ModelAdmin):
    list_display = ('position', 'winner', 'vote_count', 'resolved_at')
    list_filter = ('position',)
    readonly_fields = ('resolved_at',)
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
