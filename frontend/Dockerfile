FROM node:20-alpine AS build
WORKDIR /code
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build
FROM node:20-alpine
WORKDIR /code
COPY --from=build /code ./
EXPOSE 3000
CMD ["npm", "start"]
