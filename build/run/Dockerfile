FROM quay.io/45air/wordpress

ARG USER_ID
ARG GROUP_ID

USER root

RUN userdel -f docker &&\
	if getent group docker ; then groupdel docker; fi &&\
	groupadd -g ${GROUP_ID} docker &&\
	useradd -l -u ${USER_ID} -g docker docker &&\
	usermod -a -G sudo docker &&\
	install -d -m 0755 -o docker -g docker /home/docker &&\
	chown --silent --no-dereference --recursive --from=1000:1000 ${USER_ID}:${GROUP_ID} /home/docker /var/www

USER docker

WORKDIR /app
