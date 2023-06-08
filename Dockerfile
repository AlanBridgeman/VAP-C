FROM node:lts as dependencies
WORKDIR /vap_c_prod
COPY src/package.json src/yarn.lock ./
# Needed for Prisma client generation from what I've read
COPY src/prisma  ./prisma
# Needed configuration file and runtime secret
# For Font Awesome Pro
COPY src/npmrc  ./.npmrc
ARG FONTAWESOME_NPM_AUTH_TOKEN
RUN yarn install --force --frozen-lockfile
# Clean up the custom npm configuration
RUN rm -f .npmrc

FROM node:lts as builder
WORKDIR /vap_c_prod
COPY src/. .
COPY --from=dependencies /vap_c_prod/node_modules ./node_modules
ARG DATABASE_URL
RUN yarn build

FROM node:lts as runner
WORKDIR /vap_c_prod
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Important as the JavaScript over arching configuration
COPY --from=builder /vap_c_prod/package.json ./package.json
# Prisma is a special dependency as the database ORM
COPY --from=builder /vap_c_prod/prisma ./prisma
# Copy the lib and middleware directories over (required for server side stuff)
COPY --from=builder /vap_c_prod/lib ./lib
COPY --from=builder /vap_c_prod/middleware ./middleware
# Copy over a custom JavaScript script for application insights logging
# Used on startup
COPY --from=builder /vap_c_prod/load_appinsights.js ./load_appinsights.js
# Copy over the static asset files
COPY --from=builder /vap_c_prod/public ./public
# Copy over the generated files (optimized pages etc...)
COPY --from=builder --chown=nextjs:nodejs /vap_c_prod/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /vap_c_prod/.next/static ./.next/static
# Because I need modules not included during the next build (inside the 
# .next/standalone/node_modules folder) I want to bring the node_modules 
# folder from the dependency container into this container
COPY --from=dependencies /vap_c_prod/node_modules ./node_modules


# From what I can tell there is some kind of weird renaming bug 
# but for only these two specific files
#RUN mv ./.next/server/pages/api/users/Login.js ./.next/server/pages/api/users/login.js
#RUN mv ./.next/server/pages/api/users/Login.js.nft.json ./.next/server/pages/api/users/login.js.nft.json
#RUN mv ./.next/server/pages/api/users/Register.js ./.next/server/pages/api/users/register.js
#RUN mv ./.next/server/pages/api/users/Register.js.nft.json ./.next/server/pages/api/users/register.js.nft.json

# Setup SSH within the container
ARG SSH_PASSWORD
ENV SSH_PASSWD ${SSH_PASSWORD}
# Note: The root password must be exactly Docker! as it is used by 
#       App Service to let you access the SSH session with the 
#       container.
RUN apt-get update \
    && apt-get install -y --no-install-recommends dialog \
    && apt-get update \
    && apt-get install -y --no-install-recommends openssh-server \
    && echo "root:Docker!" | chpasswd 

COPY --from=builder /vap_c_prod/sshd_config /etc/ssh/sshd_config

# Copy and configure the ssh_setup file
RUN mkdir -p /tmp
COPY --from=builder /vap_c_prod/ssh_setup.sh /tmp
RUN chmod +x /tmp/ssh_setup.sh \
    && (sleep 1;/tmp/ssh_setup.sh 2>&1 > /dev/null)

# Install SQLlite database'
RUN apt-get update \
    && apt-get install -y sqlite3 libsqlite3-dev
RUN mkdir /db
RUN /usr/bin/sqlite3 /db/test.db "VACUUM;"

# Initialization wrapper script (to start SSH before starting server)
COPY --from=builder /vap_c_prod/init.sh /usr/local/bin
RUN chmod u+x /usr/local/bin/init.sh

EXPOSE 80 2222
ENV PORT 80
CMD ["yarn", "start"]