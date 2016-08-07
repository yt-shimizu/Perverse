# coding: utf-8

from rest_framework import serializers

from app.models import Spot


class SpotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Spot
        fields = ('name', 'lat', 'long', 'description', 'reach_count')