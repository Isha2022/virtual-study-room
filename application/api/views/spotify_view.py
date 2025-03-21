from django.http import JsonResponse
from django.shortcuts import render, redirect
from api.credentials import REDIRECT_URI, CLIENT_ID, CLIENT_SECRET
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from requests import Request, post,get
from api.utils import Spotify_API
import re
from api.models import SpotifyToken
class AuthURL(APIView):
    def get(self, request, format=True):
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'
        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url

        return Response({'url': url}, status=status.HTTP_200_OK)
    
def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    error = response.get('error')
    if not request.session.exists(request.session.session_key):
        request.session.create()

    spotify_api = Spotify_API()
    spotify_api.update_or_create_user_tokens(
        request.session.session_key, access_token, token_type, expires_in, refresh_token
    )

    return redirect('http://localhost:3000/musicPlayer')
    
class IsAuthenticated(APIView):
    def get(self, request, format=None):
        spotify_api = Spotify_API()
        is_authenticated = spotify_api.is_spotify_authenticated(
            self.request.session.session_key)
        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)
    

class GetAlbumTracks(APIView):
    def post(self, request, *args, **kwargs):
        album_url = request.data.get('album_url')
        session_id = request.session.session_key

        if not session_id:
            request.session.create()
            session_id = request.session.session_key

        # Extract Album ID from URL
        album_id_match = re.search(r'spotify:album:(\w+)', album_url) or re.search(r'album/(\w+)', album_url)
        if not album_id_match:
            return Response({"Error": "Invalid Spotify URL"}, status=status.HTTP_400_BAD_REQUEST)

        album_id = album_id_match.group(1)
        spotify_api = Spotify_API()
        tokens = spotify_api.get_user_tokens(session_id)
        if not tokens:
            return Response({"Error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        headers = {'Authorization': f'Bearer {tokens.access_token}'}
        response = get(f'https://api.spotify.com/v1/albums/{album_id}/tracks', headers=headers)  # Corrected to use requests.get

        if response.status_code != 200:
            return Response({"Error": "Failed to fetch album tracks"}, status=response.status_code)

        return Response(response.json(), status=status.HTTP_200_OK)
class GetSpotifyToken(APIView):
    def get(self, request, *args, **kwargs):
        session_id = request.session.session_key
        if not session_id:
            request.session.create()
            session_id = request.session.session_key
        
        token = SpotifyToken.objects.filter(user=session_id).first()
        if token:
            return JsonResponse({'access_token': token.access_token}, safe=False)
        else:
            return JsonResponse({'error': 'No token available'}, status=404)
        
class CurrentSong(APIView):
    def get(self, request, format=None):
        endpoint = "player/currently-playing"
        spotify_api = Spotify_API()
        session_id = request.session.session_key
        response = spotify_api.execute_spotify_api_request(session_id, endpoint)
        
        if 'error' in response or 'item' not in response:
            return Response({}, status=status.HTTP_200_OK)
        
        item = response.get("item")
        duration = item.get("duration_ms")
        progress = response.get("progress_ms")
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')

        artist_string = ""

        for i, artist in enumerate(item.get("artists")):
            if i > 0:
                artist_string += ", "
            name = artist.get("name")
            artist_string += name

        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': 0,
            'id': song_id
        }

        return Response(song, status=status.HTTP_200_OK)
    
class PlaySong(APIView):
    def put(self, request, format=None):
        session_id = request.session.session_key
        print(f"Session ID: {session_id}")
        spotify_api = Spotify_API()
        print("Attempting to play song...")

        if not session_id:
            return Response({"detail": "User session not found."}, status=status.HTTP_403_FORBIDDEN)

        result = spotify_api.play_song(session_id)
        print(f"Spotify API Response: {result}")  # Debugging output

        if "Error" in result:
            return Response({"detail": result["Error"]}, status=status.HTTP_403_FORBIDDEN)

        return Response({"detail": "Success"}, status=status.HTTP_204_NO_CONTENT)

class PauseSong(APIView):
    def put(self, request, format=None):
        session_id = request.session.session_key
        print(f"Session ID: {session_id}")
        spotify_api = Spotify_API()
        print("Attempting to pause song...")

        if not session_id:
            return Response({"detail": "User session not found."}, status=status.HTTP_403_FORBIDDEN)

        result = spotify_api.pause_song(session_id)
        print(f"Spotify API Response: {result}")  # Debugging output

        if "Error" in result:
            return Response({"detail": result["Error"]}, status=status.HTTP_403_FORBIDDEN)

        return Response({"detail": "Success"}, status=status.HTTP_204_NO_CONTENT)
    
class SkipSong(APIView):
    def post(self, request, format=None):
        session_id = request.session.session_key
        spotify_api = Spotify_API()
        result = spotify_api.skip_song(session_id)
        if not session_id:
            return Response({"detail": "User session not found."}, status=status.HTTP_403_FORBIDDEN)
        else:
            if "Error" in result:
                return Response({"detail": result["Error"]}, status=status.HTTP_403_FORBIDDEN)
        return Response({"detail": "Success"}, status=status.HTTP_204_NO_CONTENT)
            



