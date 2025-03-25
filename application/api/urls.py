from django.urls import path,include
from .views.login_page import login
from rest_framework.routers import DefaultRouter
#from .views.calendar import list_events
from .views.calendar import EventViewSet

router = DefaultRouter()
# router.register(r'events', list_events, basename='event')
router.register(r'events', EventViewSet, basename='event')

urlpatterns = [
    #path('views/login-page', login),
    path('', include(router.urls)),
]