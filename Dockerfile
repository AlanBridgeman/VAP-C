FROM node:lts as dependencies
WORKDIR /video_automation_front-end
COPY src/package.json src/yarn.lock ./
# Needed for Prisma client generation from what I've read
COPY src/prisma  ./prisma
# Needed configuration file and runtime secret
# For Font Awesome Pro
COPY src/npmrc  ./.npmrc
ARG FONTAWESOME_NPM_AUTH_TOKEN
RUN yarn install --frozen-lockfile
# Clean up the custom npm configuration
RUN rm -f .npmrc

FROM node:lts as builder
WORKDIR /video_automation_front-end
COPY src/. .
COPY --from=dependencies /video_automation_front-end/node_modules ./node_modules
RUN yarn build

FROM node:lts as runner
WORKDIR /video_automation_front-end
ENV NODE_ENV production
# If you are using a custom next.config.js file, uncomment this line.
COPY --from=builder /video_automation_front-end/next.config.js ./next.config.js
COPY --from=builder /video_automation_front-end/public ./public
COPY --from=builder /video_automation_front-end/.next ./.next
COPY --from=builder /video_automation_front-end/node_modules ./node_modules
COPY --from=builder /video_automation_front-end/package.json ./package.json
COPY --from=builder /video_automation_front-end/.env.local ./.env.local
COPY --from=builder /video_automation_front-end/prisma  ./prisma

EXPOSE 3000
CMD ["yarn", "start"]
