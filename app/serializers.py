from rest_framework import serializers
from app.models import Spot

class SpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spot
