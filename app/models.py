from django.db import models


class Spot(models.Model):
    """スポット"""
    name = models.CharField('名称', max_length=255)
    lat = models.FloatField('緯度', max_length=255)
    long = models.FloatField('経度', max_length=255)
    description = models.CharField('説明', max_length=255)
    reach_count = models.IntegerField('発見人数', blank=True, default=0)

    def __str__(self):
        return self.name
