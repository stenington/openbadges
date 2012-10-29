create database if not exists timetest;
use timetest;
set global sql_mode='';
create table if not exists times (id integer primary key auto_increment, mytime datetime);
insert into times (mytime) values ('2012-10-25T16:25:16.357Z');
