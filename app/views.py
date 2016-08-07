import json
from collections import OrderedDict
from django.http import HttpResponse
from app.models import Spot


def render_json_response(request, data, status=None):
    """response を JSON で返却"""
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    callback = request.GET.get('callback')
    if not callback:
        callback = request.POST.get('callback')  # POSTでJSONPの場合
    if callback:
        json_str = "%s(%s)" % (callback, json_str)
        response = HttpResponse(json_str, content_type='application/javascript; charset=UTF-8', status=status)
    else:
        response = HttpResponse(json_str, content_type='application/json; charset=UTF-8', status=status)
    return response


def spot_list(request):
    """スポットのJSONを返す"""
    spots = []
    for spot in Spot.objects.all().order_by('id'):
        spot_dict = OrderedDict([
            ('id', spot.id),
            ('name', spot.name),
            ('lat', spot.lat),
            ('long', spot.long),
            ('description', spot.description),
            ('reach_count', spot.reach_count)
        ])
        spots.append(spot_dict)

    data = OrderedDict([ ('spots', spots) ])
    return render_json_response(request, data)