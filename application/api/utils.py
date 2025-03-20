from datetime import datetime, timedelta
from calendar import HTMLCalendar
from urllib import request
from .models.events import Appointments
from .models.spotify_token import SpotifyToken
from django.utils import timezone
from api.credentials import CLIENT_ID, CLIENT_SECRET
from requests import post, get, put

BASE_URL = "http://api.spotify.com/v1/me/"

class Calendar(HTMLCalendar):
	def __init__(self, year=None, month=None):
		self.year = year
		self.month = month
		super(Calendar, self).__init__()

	# formats a day as a td
	# filter events by day
	def formatday(self, day, events):
		events_per_day = events.filter(start_time__day=day)
		d = ''
		for event in events_per_day:
			d += f'<li> {event.title} </li>'

		if day != 0:
			return f"<td><span class='date'>{day}</span><ul> {d} </ul></td>"
		return '<td></td>'

	# formats a week as a tr 
	def formatweek(self, theweek, events):
		week = ''
		for d, weekday in theweek:
			week += self.formatday(d, events)
		return f'<tr> {week} </tr>'

	# formats a month as a table
	# filter events by year and month
	def formatmonth(self, withyear=True):
		events = Appointments.objects.filter(start_time__year=self.year, start_time__month=self.month)

		cal = f'<table border="0" cellpadding="0" cellspacing="0" class="calendar">\n'
		cal += f'{self.formatmonthname(self.year, self.month, withyear=withyear)}\n'
		cal += f'{self.formatweekheader()}\n'
		for week in self.monthdays2calendar(self.year, self.month):
			cal += f'{self.formatweek(week, events)}\n'
		return cal
	

class Spotify_API():
	def get_user_tokens(self, session_id):
		user_tokens = SpotifyToken.objects.filter(user=session_id)
		print(f"Querying for tokens with session_id={session_id}: {user_tokens}")
		print(user_tokens)
		if user_tokens.exists():
			print("Token found:", user_tokens[0])
			return user_tokens[0]
		else:
			print("No token found for session_id:", session_id)
			return None
		
	def update_or_create_user_tokens(self, session_id, access_token, token_type, expires_in, refresh_token=None):
		tokens = self.get_user_tokens(session_id)
		expires_in = timezone.now() + timedelta(seconds=expires_in)
		if tokens:
			print(f"Updating tokens for session_id={session_id}")
			tokens.access_token = access_token
			tokens.expires_in = expires_in
			tokens.token_type = token_type
			
			if refresh_token is not None:
				tokens.refresh_token = refresh_token
				tokens.save(update_fields=['access_token', 'refresh_token', 'expires_in', 'token_type'])
			else:
				tokens.save(update_fields=['access_token', 'expires_in', 'token_type'])
		else:
			print(f"Creating new tokens for session_id={session_id}")
			tokens = SpotifyToken(
            user=session_id,
            access_token=access_token,
            refresh_token=refresh_token if refresh_token else "",
            token_type=token_type,
            expires_in=expires_in
        	)
			tokens.save()


	def is_spotify_authenticated(self, session_id):
		tokens = self.get_user_tokens(session_id)
		if tokens:
			expiry = tokens.expires_in
			if expiry <= timezone.now():
				self.refresh_spotify_token(session_id)
			return True

		return False
	
	def refresh_spotify_token(self, session_id):
		refresh_token = self.get_user_tokens(session_id).refresh_token
		response = post('https://accounts.spotify.com/api/token', data = {
			'grant_type': 'refresh_token',
			'refresh_token': refresh_token,
			'client_id': CLIENT_ID,
			'client_secret': CLIENT_SECRET,
		}).json()

		access_token = response.get('access_token')
		token_type = response.get('token_type')
		expires_in = response.get('expires_in')


		self.update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token)


	def get_album_tracks(self, album_id, session_id):
		tokens = self.get_user_tokens(session_id)
		if not tokens or not tokens.access_token:
			return {'error': 'No valid token available. User needs to reauthenticate.'}
		headers = {'Authorization': f'Bearer {tokens.access_token}'}
		response = request.get(f'https://api.spotify.com/v1/albums/{album_id}/tracks', headers=headers)
		if response.status_code == 200:
			return response.json()
		else:
			return {'error': 'Failed to fetch data from Spotify', 'status_code': response.status_code}
		

	def execute_spotify_api_request(self, session_id, endpoint, post_=False, put_=False):
		tokens = self.get_user_tokens(session_id)
		headers = {'Content-Type': 'application/json',
               'Authorization': "Bearer " + tokens.access_token}
		if post_:
			post(BASE_URL + endpoint, headers=headers)
		if put_:
			put(BASE_URL + endpoint, headers=headers)
			
		response = get(BASE_URL + endpoint, {}, headers=headers)
		try:
			return response.json()
		except:
			return {'Error': 'Issue with request'}
		
	def play_song(self, session_id):
		return self.execute_spotify_api_request(session_id, "player/play", put_=True)
	
	def pause_song(self, session_id):
		return self.execute_spotify_api_request(session_id, "player/pause", put_=True)




	
