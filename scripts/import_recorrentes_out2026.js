import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  'https://cojduxlqjwskfqqfximo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvamR1eGxxandza2ZxcWZ4aW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDUwODY3NywiZXhwIjoyMDk2MDg0Njc3fQ.LUbbcUXe5WcJb90VCjP8cj6x3C3AtriAbUSZiZsvUKk'
)

const CLINICA_ID = '0154f340-c20f-402d-9dbf-db1b3099dc7a'

// Leads de outubro 2026
// agendou: 'NÃO' | 'SIM' | 'AGENDOU PRÓXIMO MÊS' | 'AGENDOU MÊS ESPECÍFICO'
// dezembro: Daiane Ragagnin e Marilia Campos
const rows = [
  { data: '2026-10-01', nome: 'Vléria Maria de Souza',           telefone: '64999114730', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Letícia Fernandes',               telefone: '64996468781', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Maria Salete Pazzinto',           telefone: '64999882147', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Luciana Jacinta',                 telefone: '62984198988', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Liliane Ferreira',                telefone: '64999391133', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Larissa Chagas',                  telefone: '64996462893', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Mria de Lourdes Bueno',           telefone: '64999772058', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Renilda Constantino',             telefone: '64999913902', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Selma Nunes',                     telefone: '64992299057', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Maria de Fatima Santos',          telefone: '64996261251', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-01', nome: 'Maria Lucia Scarpeli',            telefone: '64999566621', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-02', nome: 'Monique Xavier',                  telefone: '64999787182', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-02', nome: 'Sueli Beniti',                    telefone: '64999858356', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-02', nome: 'Millena Maria Melo',              telefone: '64996157996', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-02', nome: 'Vanessa Mantelli',                telefone: '64999944673', agendou: 'SIM',                    vendeu: true,  valor: 1235,    obs: '' },
  { data: '2026-10-02', nome: 'Luandra Matias',                  telefone: '64993378768', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-02', nome: 'Monica Schimidt',                 telefone: '64999253095', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Stefane Mantelli',                telefone: '64999983772', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Valquiria Goulart',               telefone: '64996768734', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Amanda Sandri',                   telefone: '64999885713', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Frankely Silva',                  telefone: '64996710178', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Glaucia Brito',                   telefone: '64981162829', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Jozione Guimaraes',               telefone: '64999978904', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Gilda Freitas',                   telefone: '64999524684', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Zaina Sales',                     telefone: '64999613777', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Jaqueline Nery',                  telefone: '64999189223', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-05', nome: 'Nubia Scheneider',                telefone: '64999067433', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-06', nome: 'Mara Silva',                      telefone: '64996467367', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-06', nome: 'Mariana Ruffing',                 telefone: '64999854899', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-06', nome: 'Juliana Antonio',                 telefone: '6499194145',  agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-06', nome: 'Jaciane de Oliveira',             telefone: '64992415691', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-06', nome: 'Aline Sandra',                    telefone: '64999888113', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '19 de novembro' },
  { data: '2026-10-06', nome: 'Milena Sandri',                   telefone: '64999756429', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-06', nome: 'Sebastiao Quirino',               telefone: '64996444867', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-06', nome: 'Ozenilda Ferreira',               telefone: '13997411042', agendou: 'SIM',                    vendeu: true,  valor: 1200,    obs: '' },
  { data: '2026-10-06', nome: 'Lyzandra Morais',                 telefone: '64999919400', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-06', nome: 'Lidimar Candida',                 telefone: '64999036645', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Leticia Lara Lima',               telefone: '64996123737', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Ana Carolina Bueno',              telefone: '64999173625', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Anaiza Rezende Fianchi',          telefone: '64996011067', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Cristiane Cardoso Pinheiro',      telefone: '64996448994', agendou: 'SIM',                    vendeu: true,  valor: 1300,    obs: '' },
  { data: '2026-10-07', nome: 'Sonia Alves Bueno',               telefone: '64999475546', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Joyce Gehrke',                    telefone: '64999887715', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Gerliana Crisóstomo',             telefone: '64996431530', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Kenia Costa',                     telefone: '64999814116', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Thayna Campos Xavier',            telefone: '66996572466', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Rosangela Serafim da Costa',      telefone: '64999441599', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-07', nome: 'Jordana Andrade Mendonça',        telefone: '64999886689', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-08', nome: 'Selma Assis',                     telefone: '64999552940', agendou: 'SIM',                    vendeu: true,  valor: 14000,   obs: '' },
  { data: '2026-10-08', nome: 'Renata Padilha',                  telefone: '64992280521', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-08', nome: 'Lázara Leticia de Queiroz',       telefone: '64996014040', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-08', nome: 'Dayanna Paula Dutra',             telefone: '64999434451', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '16 de novembro' },
  { data: '2026-10-08', nome: 'Maycon Felipe Lopes',             telefone: '64999191814', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-08', nome: 'Reila Barbara Vieira',            telefone: '64984183759', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-08', nome: 'Oneida Maria de Souza',           telefone: '64992184222', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-08', nome: 'Elen Mislaine',                   telefone: '64999542283', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-08', nome: 'Aline Maia Azevedo',              telefone: '64999882670', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-08', nome: 'Caroline Duarte Alves Gentil',    telefone: '64996437693', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Kassia Pereira',                  telefone: '64992468970', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Odon Cleber',                     telefone: '64999671256', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Anna Flávia Carmo',               telefone: '64999071279', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Janaine Moreira Santos',          telefone: '64999118361', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Helô Fernandes',                  telefone: '64996467755', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Beatriz Rodrigues Viana',         telefone: '62995676214', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Lucimayre Lopes',                 telefone: '66999837142', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Laressa Neves Picolo',            telefone: '43996195588', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Maria do Rosário Ferreira',       telefone: '64999546056', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-09', nome: 'Valentina Melo Ragagnin',         telefone: '64999885585', agendou: 'SIM',                    vendeu: true,  valor: 1600,    obs: '' },
  { data: '2026-10-09', nome: 'Wellington Ferreira',             telefone: '64999523164', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '06 de novembro' },
  { data: '2026-10-13', nome: 'Ariane Valério',                  telefone: '64999811693', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-13', nome: 'Livia Franco de Carvalho',        telefone: '64981273165', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-13', nome: 'Monata Carolina',                 telefone: '64999881448', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-13', nome: 'Tulio Carvalho',                  telefone: '64996453818', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-13', nome: 'Cristina Lima da Silva',          telefone: '64984082739', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-13', nome: 'Daniela Bastos',                  telefone: '64981777700', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-13', nome: 'Ana Cleide Glóri (Jordana)',      telefone: '64996124213', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-13', nome: 'Islene Ribeiro',                  telefone: '61998208504', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-13', nome: 'Jacqueline Balz',                 telefone: '64996457237', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '06 de novembro' },
  { data: '2026-10-13', nome: 'Lays Xavier',                     telefone: '62998559393', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-14', nome: 'Camila dos Prazeres',             telefone: '64996124029', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-14', nome: 'Cintia Teixeira',                 telefone: '64999976125', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-14', nome: 'Iriane Taynara',                  telefone: '64996082500', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-14', nome: 'Valdineia Lemes Alexandre',       telefone: '64999949402', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-14', nome: 'Daiane Ragagnin',                 telefone: '64999347462', agendou: 'AGENDOU MÊS ESPECÍFICO', vendeu: false, valor: null,     obs: '02 de dezembro' },
  { data: '2026-10-14', nome: 'Célia Martins',                   telefone: '64996436306', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-14', nome: 'Tarcila Alexandre',               telefone: '64999923780', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-14', nome: 'Roxana Leal',                     telefone: '64999914344', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-14', nome: 'Karen Krapp',                     telefone: '64992247558', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-15', nome: 'Amanda Neves',                    telefone: '64992083885', agendou: 'SIM',                    vendeu: true,  valor: 1235,    obs: '' },
  { data: '2026-10-15', nome: 'Murillo Simões Silva',            telefone: '64999061219', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-15', nome: 'Carla da Silva Russo',            telefone: '64999749117', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-15', nome: 'Susana Maria Dias',               telefone: '64999771814', agendou: 'SIM',                    vendeu: true,  valor: 7900,    obs: '' },
  { data: '2026-10-15', nome: 'Graziela Ana Vizentin',           telefone: '64984025319', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-15', nome: 'Alyne Costa Tavares',             telefone: '64999232629', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-15', nome: 'Yanna Lorena do Carmo',           telefone: '64984514697', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-15', nome: 'Seila Peres de Oliveira',         telefone: '67996500431', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-15', nome: 'Cláudia Fátima Ferreira',         telefone: '64996589699', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-15', nome: 'Eliamar Crisostomo',              telefone: '64996258874', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Esislene de Sousa',               telefone: '61998066940', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Roberta Ferreira',                telefone: '64999098061', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Jussara Amate',                   telefone: '67998137204', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Eliana Fernandes',                telefone: '64999885698', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Romilda F',                       telefone: '64999551369', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Gorete Pereira Lopes',            telefone: '64999247794', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Sinomar Ferreira da Costa',       telefone: '64984450817', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Riucia Tuany',                    telefone: '64996419384', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-16', nome: 'Rafaela Freitas',                 telefone: '64999949863', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-19', nome: 'Marilia Campos',                  telefone: '64999716665', agendou: 'AGENDOU MÊS ESPECÍFICO', vendeu: false, valor: null,     obs: '03 de dezembro' },
  { data: '2026-10-19', nome: 'Lázaro Ademilson',                telefone: '64996450020', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '24 de novembro' },
  { data: '2026-10-19', nome: 'Brena Gorgen',                    telefone: '64999538589', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-19', nome: 'Niel Pereira',                    telefone: '64999316014', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-19', nome: 'Carolina Rocha',                  telefone: '64999689183', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-19', nome: 'Marciane Barros',                 telefone: '64996060334', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-19', nome: 'Wanderleia Sterchile',            telefone: '64996952719', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-19', nome: 'Denice Nunes',                    telefone: '64984794385', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '12 de novembro' },
  { data: '2026-10-19', nome: 'Daiana Oliveira',                 telefone: '64999587605', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-19', nome: 'Ealiane Assis',                   telefone: '64999551859', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-19', nome: 'Luciene Raimunda',                telefone: '64996603942', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Anelice Dias',                    telefone: '64996996441', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Roberta Teles',                   telefone: '64981198848', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '05 de novembro' },
  { data: '2026-10-20', nome: 'Fabrizia Rodrigues Silva',        telefone: '64999886958', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Aline Neis Fernandes',            telefone: '64981215716', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Dênica Rodrigues',                telefone: '64996172419', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Renata Rayane Ramos',             telefone: '64996078018', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Andressa Vicente',                telefone: '64996438496', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Alex Dias',                       telefone: '64999370607', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Marcos Souza Borges',             telefone: '64999575897', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-20', nome: 'Neila Nascimento',                telefone: '64996272919', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Nathália Caetano Fernandes',      telefone: '62991505005', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Jéssica Santos',                  telefone: '64999009448', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '30 de novembro' },
  { data: '2026-10-21', nome: 'Suilha Santana',                  telefone: '64999056270', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Viviana Lara',                    telefone: '64999639851', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Patricia Lemos',                  telefone: '64996112591', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Lucas Alves Lima',                telefone: '64999948520', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Jeane Martins',                   telefone: '64992593099', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Josiane de Souza',                telefone: '64996181736', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Luciene Alves',                   telefone: '62999071023', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-21', nome: 'Amalia Neuwald',                  telefone: '64999298320', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Cleobulo Batista',                telefone: '64992794650', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Célia Darc Silva Araujo',         telefone: '64981336683', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Adriana Menezes Silva Lemes',     telefone: '64984084121', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Amanda Santana',                  telefone: '64999767541', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Carolyne Rodrigues Mota',         telefone: '64992836383', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Pilar de Araujo',                 telefone: '62982607258', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Flaviana Teles',                  telefone: '64992672230', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Eddy Silva',                      telefone: '64999365164', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Lucinda Freese',                  telefone: '64984043491', agendou: 'SIM',                    vendeu: true,  valor: 2000,    obs: '' },
  { data: '2026-10-22', nome: 'Leida Fernandes Gama',            telefone: '64999986544', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Susinara Assis Campos',           telefone: '64992796858', agendou: 'SIM',                    vendeu: true,  valor: 6900,    obs: '' },
  { data: '2026-10-22', nome: 'Solange Mantelli',                telefone: '64999757025', agendou: 'SIM',                    vendeu: true,  valor: 2200,    obs: '' },
  { data: '2026-10-22', nome: 'Leticia Vicente',                 telefone: '64999517260', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Lucimeire',                       telefone: '64996460113', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-22', nome: 'Larissa Garay',                   telefone: '55999282108', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Sozeni Mantelli',                 telefone: '64999889247', agendou: 'SIM',                    vendeu: true,  valor: 6100,    obs: '' },
  { data: '2026-10-23', nome: 'Bruna Romão',                     telefone: '64996752508', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Kleiciane Bonfim',                telefone: '64996711147', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Leda Maria',                      telefone: '64996268312', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Sandrely Maria',                  telefone: '64999575690', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Priscila Aniceto',                telefone: '64996588090', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Dênia Portilho',                  telefone: '64999885323', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Regiane Saleesi',                 telefone: '67999714622', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Andriele Morais',                 telefone: '64999698188', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-23', nome: 'Marcia Dantas',                   telefone: '64996451738', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Amanda Ferreira',                 telefone: '64996532509', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Fabricia Silva',                  telefone: '64996017398', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Marcia Regina Frata',             telefone: '64999685016', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Katis Canaellis',                 telefone: '62993751361', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Victor Silva Rezende',            telefone: '64999353174', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Samia do Carmo',                  telefone: '64992333549', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Mariana Gouveia de Souza',        telefone: '64999350038', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Morgana Ferreira Lima',           telefone: '64996485022', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Maiara Gomes Cavalcante',         telefone: '64996079454', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-26', nome: 'Liliane Goulart',                 telefone: '64993056362', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-27', nome: 'Annete Golba',                    telefone: '64999373003', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '09 de novembro' },
  { data: '2026-10-27', nome: 'Wanessa Alves Santi',             telefone: '67999610014', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-27', nome: 'Maria Madalena Carvalho',         telefone: '64999984434', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-27', nome: 'Carolina Carvalho Soares',        telefone: '64999885552', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-27', nome: 'Samara Santana',                  telefone: '64992484090', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-27', nome: 'Fernanda Franco',                 telefone: '64999170161', agendou: 'SIM',                    vendeu: true,  valor: 4400,    obs: '' },
  { data: '2026-10-27', nome: 'Gabriela Egito',                  telefone: '61999421714', agendou: 'SIM',                    vendeu: true,  valor: 1600,    obs: '' },
  { data: '2026-10-27', nome: 'Luciana Rodrigues',               telefone: '64992418297', agendou: 'AGENDOU PRÓXIMO MÊS',    vendeu: false, valor: null,     obs: '26 de novembro' },
  { data: '2026-10-27', nome: 'Aline Jakoby',                    telefone: '64996255016', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-27', nome: 'Katrine Gobbi',                   telefone: '64999894558', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-28', nome: 'Jesana Vilela',                   telefone: '64996068435', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-28', nome: 'Patricia Godinho',                telefone: '64996276715', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-28', nome: 'Maksiley Serafim',                telefone: '64992812878', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-28', nome: 'Thaynara lves Caetano',           telefone: '64999451662', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-28', nome: 'Vanusa Batista Pamplona',         telefone: '64996460521', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-28', nome: 'Renata Mesquita',                 telefone: '62982273366', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-28', nome: 'Valeria Rodrigues Silva',         telefone: '64996064585', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Raisa Barbosa',                   telefone: '64996232654', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Carmo do Carm Jajah',             telefone: '64999944764', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Mainara da Costa',                telefone: '64999310123', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Lasara CIntia',                   telefone: '64996263737', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Denise de Moura',                 telefone: '64999880727', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Juliana Pereira',                 telefone: '64999577481', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Fabiola Monteiro',                telefone: '64992947256', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Susy Xavier',                     telefone: '64996769173', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Karen Espindola',                 telefone: '62996335600', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
  { data: '2026-10-29', nome: 'Barbara Garcia',                  telefone: '64996461969', agendou: 'NÃO',                    vendeu: false, valor: null,     obs: '' },
]

// Leads para inserir em dezembro também
const dezembros = rows.filter(r => r.agendou === 'AGENDOU MÊS ESPECÍFICO')

async function run() {
  console.log(`Total de leads: ${rows.length}`)

  // 1. Apaga outubro 2026 existente
  const { error: delErr } = await supabase
    .from('planilha_recorrentes')
    .delete()
    .eq('clinica_id', CLINICA_ID)
    .gte('data', '2026-10-01')
    .lt('data', '2026-11-01')
  if (delErr) { console.error('Erro ao apagar outubro:', delErr.message); process.exit(1) }
  console.log('Outubro apagado.')

  // 2. Insere outubro
  const payload = rows.map(r => ({
    id: randomUUID(),
    clinica_id: CLINICA_ID,
    data: r.data,
    nome: r.nome,
    telefone: r.telefone,
    agendou: r.agendou,
    vendeu: r.vendeu,
    valor: r.valor,
    observacao: r.obs || '',
  }))

  for (let i = 0; i < payload.length; i += 25) {
    const { error } = await supabase.from('planilha_recorrentes').insert(payload.slice(i, i + 25))
    if (error) { console.error(`Erro ao inserir lote ${i}:`, error.message); process.exit(1) }
    console.log(`Inseridos ${Math.min(i + 25, payload.length)}/${payload.length}`)
  }

  // 3. Insere leads de dezembro (se não existirem)
  console.log(`\nInserindo ${dezembros.length} leads em dezembro...`)
  for (const r of dezembros) {
    const { data: existe } = await supabase
      .from('planilha_recorrentes')
      .select('id')
      .eq('clinica_id', CLINICA_ID)
      .eq('nome', r.nome)
      .gte('data', '2026-12-01')
      .lt('data', '2027-01-01')
      .maybeSingle()

    if (!existe) {
      const { error } = await supabase.from('planilha_recorrentes').insert({
        id: randomUUID(),
        clinica_id: CLINICA_ID,
        data: '2026-12-01',
        nome: r.nome,
        telefone: r.telefone,
        agendou: 'NÃO',
        vendeu: false,
        valor: null,
        observacao: `Vindo de Outubro 2026 · ${r.obs}`,
      })
      if (error) console.error(`Erro ao inserir ${r.nome} em dez:`, error.message)
      else console.log(`  ✓ ${r.nome} → dezembro`)
    } else {
      console.log(`  → ${r.nome} já existe em dezembro`)
    }
  }

  console.log('\nConcluído!')
}

run()
