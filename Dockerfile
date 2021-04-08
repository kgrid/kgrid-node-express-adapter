# Use the following command to build the image:
# sudo docker build -t kgrid/noderuntime .

# Use the following command to run the image on Linux:
# sudo docker run --network host kgrid/noderuntime

# Use the following command to run the image on Windows:
# docker run -it -p :3000:3000 -e KGRID_PROXY_ADAPTER_URL=http://host.docker.internal:8080 kgrid/noderuntime

FROM node:15.14.0-alpine3.10
MAINTAINER kgrid (kgrid-developers@umich.edu)

RUN npm install -g @kgrid/noderuntime

ENTRYPOINT kgrid-node
