# New "version" of sobreposicoes_mieic.py
# Takes in a list of course unit "siglas" and a school year to check for student overlaps
# Requests the password securely via getpass ;)
# Only requires "requests" to be installed (which most likely already is hehe)

import requests
import argparse
import getpass
from functools import reduce

BASE_URL = 'https://sigarra.up.pt/feup/pt'


def get_uc_info_by_sigla(year, sigla):
    # pv_curso_id=742 -> MIEIC
    # pv_uc_sigla -> UC's "Sigla" to search for
    # pv_ano_lectivo -> year to search in. 2019 means 2019/2020
    params = {
        'pv_ano_lectivo': year,
        'pv_curso_id': 742,
        'pv_uc_sigla': sigla,
    }
    response = requests.get(
        f'{BASE_URL}/mob_ucurr_geral.pesquisa', params=params)
    data = response.json()
    nr_search_hits = data.get('total')
    if nr_search_hits != 1:
        print(
            f'Número de UCs encontradas diferente de 1! Expected: 1 Got: {nr_search_hits}')
        print('A UC poderá não existir, por favor confirme a sigla e o ano')
        raise Exception('UC Search Invalid Results')
    return data.get('resultados')[0]


def login_to_session(username, password):
    s = requests.Session()
    params = {'pv_login': username, 'pv_password': password}
    resp = s.get(f'{BASE_URL}/mob_val_geral.autentica', params=params)

    if resp.status_code == 200:
        return s
    else:
        print('Error logging in! Invalid username or password?')
        raise Exception('Authentication Error')


def get_uc_inscritos_by_ocorr_id(ocorr_id, logged_session):
    """
    Requires a logged in session (see login_to_session)
    """
    params = {'pv_ocorrencia_id': ocorr_id}
    response = logged_session.get(
        f'{BASE_URL}/mob_ucurr_geral.uc_inscritos', params=params)

    if response.apparent_encoding == 'ISO-8859-1':
        print('Encoding estranho na resposta de alunos da UC. Possivelmente não foram encontrados dados para a ocorrência.')
        print('Resposta:' + response.content)
        raise Exception('UC Occurrence not found!')
    else:
        return response.json()


def intersect(dict_list1, dict_list2):
    return [x for x in dict_list1 if x in dict_list2]


def parse_args():
    parser = argparse.ArgumentParser(
        description="A small tool to help identify which subjects have students in common, in order to better schedule their final exams")
    parser.add_argument(
        '-y', help='School year to consider. 2018 corresponds to 2018-2019')
    parser.add_argument(
        '-ucs', nargs='+', help='List of space separated upper case typed subjects to be analyzed (e.g., CPAR LAPD TBDA)', required=True)
    parser.add_argument('-u', help='Username to authenticate in Sigarra')

    return vars(parser.parse_args())


if __name__ == '__main__':
    args = parse_args()

    ucs_info = [get_uc_info_by_sigla(args['y'], uc) for uc in args['ucs']]

    username = args['u']
    password = getpass.getpass()
    logged_session = login_to_session(username, password)

    ucs_students = [get_uc_inscritos_by_ocorr_id(
        uc_info['ocorr_id'], logged_session) for uc_info in ucs_info]

    intersection = reduce(lambda uc1_students, uc2_students: intersect(
        uc1_students, uc2_students), ucs_students)

    print(f'#Students in common: {len(intersection)}')

    print('Students:')
    for student in intersection:
        print(f'{student["nome"]} ({student["codigo"]})')
