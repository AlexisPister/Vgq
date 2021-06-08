import logging
import sys
logging.basicConfig(stream=sys.stderr)
sys.path.insert(0, '/var/www/VisualQueries/backend')
#sys.path.insert(0, '/home/alexis/Projects/aleclust/aleclust')
from VisualQueries import app as application
