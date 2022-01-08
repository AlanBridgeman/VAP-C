FROM node:lts as dependencies
WORKDIR /video_automation_front-end
COPY src/package.json src/yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:lts as builder
WORKDIR /video_automation_front-end
COPY src/. .
COPY --from=dependencies /video_automation_front-end/node_modules ./node_modules
RUN yarn build

FROM node:lts as runner
WORKDIR /video_automation_front-end
ENV NODE_ENV production
# If you are using a custom next.config.js file, uncomment this line.
COPY --from=builder /video_automation_front-end/next.config.js ./
COPY --from=builder /video_automation_front-end/public ./public
COPY --from=builder /video_automation_front-end/.next ./.next
COPY --from=builder /video_automation_front-end/node_modules ./node_modules
COPY --from=builder /video_automation_front-end/package.json ./package.json

EXPOSE 3000
CMD ["yarn", "start"]
