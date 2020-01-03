FROM quay.io/45air/wordpress

ARG USER_ID
ARG GROUP_ID
ARG OS_TYPE

USER root

RUN if [ "$OS_TYPE" != "Darwin" ];\
	then userdel -f docker &&\
	groupadd -g ${GROUP_ID} docker &&\
	useradd -l -u ${USER_ID} -g docker docker &&\
	usermod -a -G sudo docker &&\
	install -d -m 0755 -o docker -g docker /home/docker &&\
	chown --silent --no-dereference --recursive --from=1000:1000 ${USER_ID}:${GROUP_ID} /home/docker /var/www;\
	fi

USER docker

WORKDIR /app
