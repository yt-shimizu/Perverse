from django.db import models


class Spot(models.Model):
    """スポット"""
    name = models.CharField('名称', max_length=255)
    lat = models.FloatField('緯度', blank=True, default=0)
    long = models.FloatField('経度', blank=True, default=0)
    description = models.CharField('説明', max_length=255)

    def __str__(self):
        return self.name

class Count(models.Model):
    """発見人数"""
    spot = models.ForeignKey(Spot, verbose_name='スポット', related_name='spot')
    ipaddr = models.CharField('ipアドレス', max_length=255)

    def __str__(self):
        return self.ipaddr
