#!/usr/bin/env zx

// Copyright 2021 Google LLC

echo(chalk.green('Started Setup server'))

echo(chalk.blue('#Step 1 - Installing Nginx'))
echo('Running: sudo apt update.. ')
await $`sudo apt update`

echo('Running: sudo apt install nginx.. ')
await $`sudo apt install nginx`


echo(chalk.blue('#Step 2: Adjusting the Firewall'))
echo('Check ufw app list')
await $`sudo ufw app list`

echo('Add ssh to the firewall')
await $`sudo ufw allow ssh`
await $`sudo ufw allow OpenSSH`

echo('Enable Nginx on the firewall')
await $`sudo ufw allow 'Nginx HTTP'`

echo('Enable the firewall')
await $`sudo ufw enable`
await $`sudo ufw default deny`

echo('Check the changes status')
await $`sudo ufw status`


echo(chalk.blue('#Step 3 – Checking your Web Server'))
echo('Status of the Nginx')
await $`systemctl status nginx`


echo(chalk.blue('#Step 4 - Install PHP'))
await $`sudo apt install php-fpm php-mysql`
await $`sudo apt install php-mbstring php-xml php-bcmath php-simplexml php-intl php-mbstring php7.4-gd php7.4-curl php7.4-zip`
await $`php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"`
await $`php -r "if (hash_file('sha384', 'composer-setup.php') === '55ce33d7678c5a611085589f1f3ddf8b3c52d662cd01d4ba75c0ee0459970c2200a51f492d557530c71c15d8dba01eae') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"`
await $`php composer-setup.php`
await $`php -r "unlink('composer-setup.php');"`
await $`sudo mv composer.phar /usr/bin/composer`

echo(chalk.blue('#Step 5 - Install MySQL'))
await $`sudo apt install mysql-server`

echo(chalk.blue('#Step 9: Setting Up Server & Project'))
let domainName = await question('What is your domain name? ')
echo(chalk.green(`Your domain name is: ${domainName} \n`))

await $`sudo rm -f /etc/nginx/sites-enabled/chawkbazar`
await $`sudo rm -f /etc/nginx/sites-available/chawkbazar`
await $`sudo touch /etc/nginx/sites-available/chawkbazar`
await $`sudo chmod -R 777 /etc/nginx/sites-available/chawkbazar`

echo(chalk.blue('Settings Running For REST API'))

await $`sudo echo 'server {
        listen 80;

        server_name ${domainName};

        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options "nosniff";

        index index.html index.htm index.php;

        charset utf-8;

        # For API
        location /backend {
            alias /var/www/chawkbazar-laravel/chawkbazar-api/public;
            try_files $uri $uri/ @backend;
                location ~ \\.php$ {
                include fastcgi_params;
                fastcgi_param SCRIPT_FILENAME $request_filename;
                fastcgi_pass   unix:/run/php/php7.4-fpm.sock;
             }
       }

       location @backend {
          rewrite /backend/(.*)$ /backend/index.php?/$1 last;
       }

       # For FrontEnd
       location /{
            proxy_pass http://localhost:3003;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location /admin{
            proxy_pass http://localhost:3002/admin;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        error_page 404 /index.php;

        location ~ \\.php$ {
            fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
            include fastcgi_params;
        }

        location ~ /\\.(?!well-known).* {
            deny all;
        }
    }' > '/etc/nginx/sites-available/chawkbazar'`;


echo(chalk.blue('\nEnabling the config'))
await $`sudo ln -s /etc/nginx/sites-available/chawkbazar /etc/nginx/sites-enabled/`

//below comment will check nginx error
await $`sudo nginx -t`
await $`sudo systemctl restart nginx`


echo(chalk.blue('Securing Nginx with Let\'s Encrypt'))
await $`sudo apt install certbot python3-certbot-nginx`
await $`sudo ufw status`
await $`sudo ufw allow 'Nginx Full'`
await $`sudo ufw delete allow 'Nginx HTTP'`
await $`sudo ufw status`
await $`sudo certbot --nginx -d ${domainName}`

echo(chalk.green('Nginx Setup success!'))
