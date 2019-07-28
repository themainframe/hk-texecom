# `hk-texecom`

*A bridge between Texecom Premier Elite security systems and Apple HomeKit via HAP-NodeJS*

![hk-texecom](https://s3-eu-west-1.amazonaws.com/assets-misc.damow.net/texecom-homekit-demo.jpg)

## Preface

`hk-texecom` lets you map zones on your [Texecom](https://texe.com/uk/) Premier Elite panel as sensor-type devices in [HomeKit](https://www.apple.com/uk/ios/home/). The main advantage to this is the ability to create HomeKit automations based on zones going active/secure.

_In future, you'll also be able to map the panel's set/unset functionality as a HomeKit Security System device, letting you set and unset by asking Siri!_

To use it, you'll require a Texecom Premier Elite security system with an [appropriate IP communicator](https://texe.com/uk/products/series/communicators/premier-elite-series/) (Com-WiFi/ComIP, or your own [custom UART-over-IP solution](https://gw0udm.wordpress.com/2016/09/17/texecom-comwifi-diy/#jp-carousel-855)).

## Todo

* Only Crestron (`crestron`) protocol is supported at the moment (since this is supported by even older panels and provides an easy way to receive realtime zone status updates).
* The Crestron protocol doesn't (easily) facilitate setting and unsetting of the system. As a result, mapping areas currently doesn't work, so the default configuration file doesn't include any.

## Setup

* Check out the project.
* Copy `config.yml.dist` to `config.yml` and configure as desired. Add any zones that you would like to be mapped as HomeKit sensor devices. Configure the address and port number of your panel communicator. The Com port that your communciator is connected to should be configured to be **Crestron System** in **Engineer &rarr; UDL/Digi Options &rarr; Com Port Setup**.
* Ensure you have a recent (`>8.0)`) version of Node. Recommend obtaining that either using your package manger or as a download from the NodeJS website - [https://nodejs.org/en/download/](https://nodejs.org/en/download/).
* Install the dependencies with `yarn install` or `npm install` (prefer `yarn`!)

_Optionally_, if you want to set up `hk-texecom` as a long-running process that will restart if it dies:

* Install `forever` with `sudo npm install -g forever`
* Add this line to the desired user's `crontab`: `@reboot NODE_ENV=prod PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin /usr/local/bin/forever start {PATH_TO_TEXECOM_HOMEKIT}/forever.json > /dev/null 2>&1` - **remembering** to replace `{PATH_TO_TEXECOM_HOMEKIT}` with the relevant path to the project.
* Check `hk-texecom` has started with `forever list`.
