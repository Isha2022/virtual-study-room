from rest_framework import serializers
from api.models.events import Appointments



class AppointmentSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name')  # Maps title → name
    start = serializers.DateTimeField(source='start_date')  # Maps start → start_date
    end = serializers.DateTimeField(source='end_date')  # Maps end → end_date
    description = serializers.CharField(source='comments', required=False)  # Maps description → comments

    class Meta:
        model = Appointments
        fields = ['id', 'title', 'description', 'start', 'end', 'user']
        extra_kwargs = {
            'user': {'read_only': True},  # Prevent the client from setting the user
        }
    
    # def create(self, validated_data):
    #     request = self.context.get('request')
    #     if request and hasattr(request, 'user'):
    #         validated_data['user'] = request.user
    #     else:
    #         raise serializers.ValidationError("User not found in request context.")
    #     return Appointments.objects.create(**validated_data)

    