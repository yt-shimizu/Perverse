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
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser // 管理ユーザ作成
python manage.py get_spot_data
python manage.py loaddata spot_data // Spotデータ作成
```

### runserver
```
# http://127.0.0.1:8000/app/
# http://127.0.0.1:8000/admin/
python manage.py runserver
```
