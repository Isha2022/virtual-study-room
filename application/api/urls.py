from django.urls import path,include
from .views.login_page import login
from rest_framework.routers import DefaultRouter
#from .views.calendar import list_events
from .views.calendar import EventViewSet
from .views.spotify_view import AuthURL, spotify_callback, IsAuthenticated, GetAlbumTracks, GetSpotifyToken, CurrentSong, PauseSong, PlaySong

router = DefaultRouter()
# router.register(r'events', list_events, basename='event')
router.register(r'events', EventViewSet, basename='event')


urlpatterns = [
    #path('views/login-page', login),
    path('', include(router.urls)),
    path('get-auth-url', AuthURL.as_view()), 
    path('is-authenticated', IsAuthenticated.as_view()),
    path('spotify/callback/', spotify_callback, name="spotify-callback"),
    path('get-album-tracks', GetAlbumTracks.as_view(), name='get_album_tracks'),
    path('token/', GetSpotifyToken.as_view(), name='get-token'),
    path('current-playing', CurrentSong.as_view(), name='current-playing'),
    path('pause', PauseSong.as_view()),
    path('play', PlaySong.as_view()),
    #path('', include(router.urls)),

]