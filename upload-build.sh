#!/usr/bin/expect -f

set timeout 60
set password "o6gZZqiM"

# Upload dist.tar.gz
spawn scp web/dist.tar.gz root@81.7.11.191:/var/www/henkes-stoffzauber.de/web/
expect {
    "password:" {
        send "$password\r"
        expect eof
    }
    "yes/no" {
        send "yes\r"
        expect "password:"
        send "$password\r"
        expect eof
    }
}

# Extract on server
spawn ssh root@81.7.11.191 "cd /var/www/henkes-stoffzauber.de/web && rm -rf dist && tar xzf dist.tar.gz && rm dist.tar.gz && echo 'Build deployed successfully'"
expect {
    "password:" {
        send "$password\r"
        expect eof
    }
}
