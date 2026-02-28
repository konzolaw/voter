from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'positions', views.PositionViewSet)
router.register(r'candidates', views.CandidateViewSet)
router.register(r'voters', views.VoterViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('verify-voter/', views.VoterViewSet.as_view({'post': 'verify_voter'}), name='verify-voter'),
    path('voters/add/', views.VoterViewSet.as_view({'post': 'add_voter'}), name='add-voter'),
    path('voters/<int:pk>/remove/', views.VoterViewSet.as_view({'delete': 'remove_voter'}), name='remove-voter'),
    path('submit-votes/', views.submit_votes, name='submit-votes'),
    path('system-state/', views.system_state, name='system-state'),
    path('close-voting/', views.close_voting, name='close-voting'),
    path('release-results/', views.release_results, name='release-results'),
    path('results/', views.get_results, name='results'),
    path('stats/', views.voting_stats, name='stats'),
]
