# Originally created and updated by some folks over at "Comissão de Acompanhamento do MIEIC".
# Useful for checking student collisions between Course Units for scheduling exams
# I have since "deprecated" this (I stopped supporting this, but since it was not version controlled, not sure if it is supported by someone else) since I didn't like the selenium usage
# and I found some documentation on SIGARRA's mobile API which came in handy since this was possible just via requests (see sobreposicoes_v2.py)

import argparse
import re
from itertools import chain, combinations
from selenium import webdriver

BASE_URL = 'https://sigarra.up.pt/feup/pt'

#Calculate list powerset (copied from itertools recipes)
def powerset(iterable):
    "powerset([1,2,3]) --> () (1,) (2,) (3,) (1,2) (1,3) (2,3) (1,2,3)"
    s = list(iterable)
    return chain.from_iterable(combinations(s, r) for r in range(len(s)+1))

#Because selenium webelement's get attribute doesn't throw exception on key not found
def get_attribute_exception(elem, attr):
    if elem.get_attribute(attr) is None:
        raise AttributeError
    return elem.get_attribute(attr)

#retrieve student list (upxxxxxxxxx) for a specific subject
def get_uc_students(browser, link):
    students = []

    new_link = link.replace('ucurr_geral.ficha_uc_view', 'fest_geral.estudantes_inscritos_list')
    browser.get(new_link)

    #Extract students from first page (which is guaranteed to exist)
    for student in browser.find_elements_by_xpath('//td[@class="k"]/a'):
        students.append(student.text)

    #Extract students from other pages, if applicable
    last_page = 1
    try:
        regex_match = re.search('pv_num_pag=(\d+)', get_attribute_exception(browser.find_element_by_xpath('//img[@title="Último Resultado"]/..'), 'href'))
        last_page = int(regex_match.group(1))
    #Anchor has no link to last page, meaning first page is already the last
    except AttributeError:
        pass

    for page in range(2, last_page + 1):
        browser.get('{}&pv_num_pag={}'.format(new_link, page))
        for student in browser.find_elements_by_xpath('//td[@class="k"]/a'):
            students.append(student.text)

    return students

#Parses program arguments
def parse_args():
    parser=argparse.ArgumentParser(description="A small tool to help identify which subjects have students in common, in order to better schedule the final exams")

    parser.add_argument('-cd', help='Chrome Driver shared library path. Defaults to the executable name, assuming its path is in PATH', default='chromedriver')
    parser.add_argument('-y', help='School year to consider. Defaults to 2018 (corresponding to 2018/2019)', default='2018')
    parser.add_argument('-ucs', nargs='+', help='List of space separated upper case typed subjects to be analyzed (e.g., CPAR LAPD TBDA)', required=True)
    parser.add_argument('-u', help='Username to authenticate in Sigarra', default='up201504088')
    parser.add_argument('-p', help='Password to authenticate in Sigarra')

    return vars(parser.parse_args())

#Authenticates into Sigarra (necessary to view student list)
def authenticate(browser, user, password):
    browser.find_element_by_id('user').send_keys(args['u'])
    browser.find_element_by_id('pass').send_keys(args['p'])
    browser.find_element_by_xpath('//*[@id="caixa-validacao-conteudo"]/button').click()

if __name__ == '__main__':
    args = parse_args()

    #Open course page
    browser = webdriver.Chrome(executable_path=args['cd'])
    browser.get('{}/cur_geral.cur_planos_estudos_view?pv_plano_id=2496&pv_ano_lectivo={}&pv_tipo_cur_sigla=&pv_origem=CUR'.format(BASE_URL, args['y']))

    authenticate(browser, args['u'], args['p'])
    
    #Get URLs for each subject's page
    uc_links = [{'name': uc, 'link': browser.find_element_by_xpath('//td[text()="{}"]/following-sibling::td/a'.format(uc)).get_attribute('href')} for uc in args['ucs']]

    #Get students for each subject
    uc_students = {uc['name']: get_uc_students(browser, uc['link']) for uc in uc_links}

    #Calculate intersection for each subset calculated in powerset and, if not empty, show the intersection
    for subset in [subset for subset in powerset(args['ucs']) if len(subset) > 1]:
        intersection = list(set.intersection(*map(set, [uc_students[uc] for uc in subset])))
        if len(intersection) > 0:
            # print("Subjects: " + str(subset) + " | students in common: " + str(intersection))
            print("Subjects: " + str(subset) + " | students in common (" + str(len(intersection)) + "): " + str(intersection))

    #Close browser
    browser.quit()
