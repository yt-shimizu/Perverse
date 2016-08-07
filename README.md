# Perverse

縁結びハッカソン 2016/08/07

## 環境構築
### pyenv / pyenv-virtualenv
```
# pyenvのインストール
$ brew install pyenv

# pyenv-virtualenvのインストール
$ brew install pyenv-virtualenv

$ vim ~/.bash_profile

export PATH="$HOME/.pyenv/bin:$PATH"
eval "$(pyenv init -)"
eval "$(pyenv virtualenv-init -)"

$ source ~/.bash_profile

$ pyenv install 3.5.1
$ pyenv virtualenv 3.5.1 dev
```

### pip install
```
pyenv activate dev
pip install -r pyp_list.txt
```

### migrate
```
python manage.py migrate
```

### run server
```
python manage.py runserver
```

