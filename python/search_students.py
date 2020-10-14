# Takes in a list of "ups"
# Requests the password securely via getpass ;)
# Only requires "requests" to be installed (which most likely already is hehe)

import requests
import argparse
import getpass
from pprint import pp

BASE_URL = 'https://sigarra.up.pt/feup/pt'

def login_to_session(username, password):
    s = requests.Session()
    params = {'pv_login': username, 'pv_password': password}
    resp = s.get(f'{BASE_URL}/mob_val_geral.autentica', params=params)

    if resp.status_code == 200:
        return s
    else:
        print('Error logging in! Invalid username or password?')
        raise Exception('Authentication Error')


def get_student_info_by_up(up, logged_session):
    """
    Requires a logged in session (see login_to_session)
    """
    params = {'pv_n_estudante': up}
    response = logged_session.get(
        f'{BASE_URL}/mob_fest_geral.pesquisa', params=params)
    
    data = response.json()

    if len(data['resultados']) > 1:
        print(f"Atenção, >1 resultado para o up {up}. Algo poderá estar errado...")

    return data

def parse_args():
    parser = argparse.ArgumentParser(
        description="test")
    parser.add_argument(
        '-ups', nargs='+', help='List of space separated student ups', required=True)
    parser.add_argument('-u', help='Username to authenticate in Sigarra')

    return vars(parser.parse_args())


if __name__ == '__main__':
    args = parse_args()

    username = args['u']
    password = getpass.getpass()
    logged_session = login_to_session(username, password)

    students_info = [get_student_info_by_up(up, logged_session) for up in args['ups']]

    print('Students:')
    for student_info in students_info:
        pp(student_info['resultados'][0])
        # print(f'{student["nome"]} ({student["codigo"]})')
