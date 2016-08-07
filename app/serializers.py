from rest_framework import serializers
from app.models import Spot, Count

class SpotSerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField()
    class Meta:
        model = Spot

    def get_count(self, obj):
        return obj.spot.count()

class CountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Count