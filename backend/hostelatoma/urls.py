import re

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import FileResponse, Http404
from django.views.static import serve as serve_static


def react_index(request, *args, **kwargs):
    index = settings.REACT_BUILD_DIR / 'index.html'
    if index.exists():
        return FileResponse(open(index, 'rb'), content_type='text/html')
    raise Http404('Frontend non buildé. Lancez : npm run build')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/', include('apps.hostels.urls')),
    path('api/v1/', include('apps.reservations.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/v1/', include('apps.external_residences.urls')),
    path('api/v1/', include('apps.notifications.urls')),
    path('api/v1/', include('apps.sitesettings.urls')),
    path('api/v1/', include('apps.dashboard.urls')),
    re_path(r'^(?!api/|admin/|media/|static/).*$', react_index),
]


# django.conf.urls.static.static() sert /media/ uniquement quand DEBUG=True — hors
# de propos ici puisque ce projet n'a pas de serveur web (nginx…) devant Gunicorn
# pour prendre le relais en production. On enregistre donc la vue explicitement,
# sans condition sur DEBUG (même mécanisme que static(), sans le garde-fou).
urlpatterns += [
    re_path(
        r'^%s(?P<path>.*)$' % re.escape(settings.MEDIA_URL.lstrip('/')),
        serve_static,
        {'document_root': settings.MEDIA_ROOT},
    ),
]
