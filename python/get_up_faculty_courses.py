import json
import requests
import argparse


def parse_args():
    parser = argparse.ArgumentParser(
        description="Small test tool to list a certain faculty's courses")
    parser.add_argument(
        '-y', help='School year to consider. 2018 corresponds to 2018-2019', required=True)
    parser.add_argument(
        '-fac', help='Faculty for which to get the courses', required=True)
    parser.add_argument(
        '-sigla', help='Course sigla to search for', default='')

    return vars(parser.parse_args())


def get_faculty_id_from_acronym(acronym):
    with open('faculty_ids.json') as json_file:
        data = json.load(json_file)
        return data[acronym]


if __name__ == '__main__':
    args = parse_args()

    # faculty_acronym = 'feup'
    faculty_acronym = args['fac']
    # inst_id = 18490
    inst_id = get_faculty_id_from_acronym(faculty_acronym)
    # year = 2019
    year = args['y']
    # sigla = 'MIEIC'
    sigla = args['sigla']

    params = {
        'pv_search_inst_adm': '',
        'pv_search_alect': year,
        'pv_search_inst_id': inst_id,
        'pv_search_cod': '',
        'pv_search_nome': '',
        'pv_search_sigla': sigla,
    }

    url = f'https://sigarra.up.pt/{faculty_acronym}/pt/cur_lov_geral.get_json_cursos_ga'

    resp = requests.get(url, params=params)

    if resp.status_code == 200:
        print(resp.json())
    else:
        print('Error listing faculty\'s courses')
