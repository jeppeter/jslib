@echo off
set script_dir=%~dp0
node %script_dir%\downgithub.js -vvvv -P z:\samples --log-files z:\log2.txt download https://github.com/gradle/gradle/tree/master/subprojects/docs/src/samples