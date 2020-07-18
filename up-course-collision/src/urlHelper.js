const pageNumberOrNothing = (pageNumber) => (pageNumber && `&pv_pag=${pageNumber}`) || "";

/* eslint-disable max-len */
export default Object.freeze({
    FACULTY_COURSES: (selectedFaculty, schoolYear, instId) =>
        `/sigarra-api/${selectedFaculty}/pt/cur_lov_geral.get_json_cursos_ga?pv_search_inst_adm=&pv_search_alect=${schoolYear}&pv_search_inst_id=${instId}&pv_search_cod=&pv_search_nome=&pv_search_sigla=`,
    COURSE_UNITS: (selectedFaculty, schoolYear, selectedCourseId, pageNumber) =>
        `/sigarra-api/${selectedFaculty}/pt/mob_ucurr_geral.pesquisa?pv_ano_lectivo=${schoolYear}&pv_curso_id=${selectedCourseId}${pageNumberOrNothing(pageNumber)}`,
    LOGIN: (selectedFaculty, username, password) => `/sigarra-api/${selectedFaculty}/pt/mob_val_geral.autentica?pv_login=${encodeURIComponent(username)}&pv_password=${encodeURIComponent(password)}`,
    STUDENTS_IN_UC: (selectedFaculty, ocurrenceId) => `/sigarra-api/${selectedFaculty}/pt/mob_ucurr_geral.uc_inscritos?pv_ocorrencia_id=${ocurrenceId}`,
});
