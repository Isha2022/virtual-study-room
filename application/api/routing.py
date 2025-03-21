from django.urls import re_path
from . import consumers
from .consumers import RoomConsumer

websocket_urlpatterns = [
    re_path(r"ws/room/(?P<room_code>\w+)/$", consumers.RoomConsumer.as_asgi()),
    re_path(r'ws/todolist/(?P<room_code>\w+)/$', consumers.RoomConsumer.as_asgi()),
]
