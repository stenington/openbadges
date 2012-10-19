class openbadges::db {  
  define mysqldb( $user, $password, $encoding ) {
    exec { "create-${name}-db":
      unless => "/usr/bin/mysql -u${user} -p${password} ${name}",
      command => "/usr/bin/mysql -uroot -p$mysql_password -e \"create database ${name} character set ${encoding}; grant all on ${name}.* to ${user}@localhost identified by '$password';\"",
      require => [ Package['mysql-server'], Package['mysql-client'] ],
    }
  }
  mysqldb { "openbadges":
    user => "badgemaker",
    password => "secret",
    encoding => "utf8",
  }  
  mysqldb { "test_openbadges":
    user => "badgemaker",
    password => "secret",
    encoding => "utf8",
  }  
}

class openbadges::app ($node_version) {
  Exec { path => ['/usr/local/bin','/usr/local/sbin','/usr/bin/','/usr/sbin','/bin','/sbin', "/home/vagrant/nvm/${node_version}/bin"], }
  
  define npm( $directory=true ) {
    exec { "install-${name}-npm-package":
      unless => "test -d $directory/$name",
      command => "npm install -g $name",
      require => Exec['install-node'],
    }
  }
  
  npm { "vows": }
  npm { "jshint": }
  npm { "up": }
  npm { "recess": }
  
  file { "package.json":
    path => "/home/vagrant/package.json",
    source => "/home/vagrant/openbadges/package.json",
    before => Exec['npm-install-packages'],
  }
  
  exec { "npm-install-packages":
    cwd => "/home/vagrant/",
    command => "npm install .",
    require => Exec['install-node'],
  }

  exec { "copy-env-vars-sh":
    cwd => "/tmp/vagrant-puppet/manifests/files",
    command => "cp env.sh /home/vagrant/env.sh",
    creates => "/home/vagrant/env.sh",
  }

  exec { "set-base-env":
    command => "echo 'export OPENBADGES_BASE=/home/vagrant/openbadges' >> /home/vagrant/.bashrc",
    onlyif => "grep -q 'OPENBADGES_BASE' /home/vagrant/.bashrc; test $? -eq 1",
  }

  exec { "source-env-vars":
    command => "echo 'source /home/vagrant/env.sh' >> /home/vagrant/.bashrc",
    onlyif => "grep -q 'source /home/vagrant/env.sh' /home/vagrant/.bashrc; test $? -eq 1",
    require => Exec["set-base-env"],
  }
  
  file { "/usr/bin/start-server":
    source => "/tmp/vagrant-puppet/manifests/files/start-server.sh",
    mode => 0755;
  }
}
