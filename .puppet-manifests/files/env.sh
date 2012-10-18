# This script relies on OPENBADGES_BASE already existing in the
# environment, pointing to your openbadges installation directory.
# ----- 

export NODE_ENV=development

# either http or https
export OPENBADGES_PROTOCOL=http

# hostname is important for authentication,
# if it doesn't match the URL you're serving from,
# backpack won't work.
export OPENBADGES_HOSTNAME=localhost

# When constructing absolute URLs, this port will be appended to the host
# This can be different from the internal port if you have a proxy in front
# of node.
export OPENBADGES_PORT=8888

# Various files related to cookie management and other things are saved here.
export OPENBADGES_VAR_PATH=$OPENBADGES_BASE/var

# Where to cache badge images from the issued badges
export OPENBADGES_BADGE_PATH=$OPENBADGES_BASE/static/_badges

# Administrators, users with these accounts can access certain pages
export OPENBADGES_ADMINS=[example@example.com]

# Database configuration
# Make sure to create a user that has full privileges to the database
export OPENBADGES_DATABASE_DRIVER=mysql
export OPENBADGES_DATABASE_HOST=127.0.0.1
export OPENBADGES_DATABASE_USER=badgemaker
export OPENBADGES_DATABASE_PASSWORD=secret
export OPENBADGES_DATABASE_DATABASE=openbadges

# BrowserID verifier location.
# You almost certainly shouldn't need to change this.
export OPENBADGES_IDENTITY_PROTOCOL=https
export OPENBADGES_IDENTITY_SERVER=verifier.login.persona.org
export OPENBADGES_IDENTITY_PATH=/verify