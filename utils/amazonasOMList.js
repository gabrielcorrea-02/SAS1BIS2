const amazonasOMList = [
  { value: "12BSup", sigla: "12BSup", nome: "12º Batalhão de Suprimento", guarnicao: "Manaus/AM", label: "12BSup - 12º Batalhão de Suprimento - Manaus/AM" },
  { value: "12GAAAeSl", sigla: "12GAAAeSl", nome: "12º Grupo de Artilharia Antiaérea de Selva", guarnicao: "Manaus/AM", label: "12GAAAeSl - 12º Grupo de Artilharia Antiaérea de Selva - Manaus/AM" },
  { value: "12RM", sigla: "12RM", nome: "Comando da 12ª Região Militar", guarnicao: "Manaus/AM", label: "12RM - Comando da 12ª Região Militar - Manaus/AM" },
  { value: "16BaLog", sigla: "16BaLog", nome: "16ª Base Logística", guarnicao: "Tefé/AM", label: "16BaLog - 16ª Base Logística - Tefé/AM" },
  { value: "16BISl", sigla: "16BISl", nome: "Comando da 16ª Brigada de Infantaria de Selva", guarnicao: "Tefé/AM", label: "16BISl - Comando da 16ª Brigada de Infantaria de Selva - Tefé/AM" },
  { value: "17BIS", sigla: "17BIS", nome: "17º Batalhão de Infantaria de Selva", guarnicao: "Tefé/AM", label: "17BIS - 17º Batalhão de Infantaria de Selva - Tefé/AM" },
  { value: "1BComSl", sigla: "1BComSl", nome: "1º Batalhão de Comunicações de Selva", guarnicao: "Manaus/AM", label: "1BComSl - 1º Batalhão de Comunicações de Selva - Manaus/AM" },
  { value: "1BISAmv", sigla: "1BIS(Amv)", nome: "1º Batalhão de Infantaria de Selva (Aeromóvel)", guarnicao: "Manaus/AM", label: "1BIS(Amv) - 1º Batalhão de Infantaria de Selva (Aeromóvel) - Manaus/AM" },
  { value: "2BISl", sigla: "2BISl", nome: "Comando da 2ª Brigada de Infantaria de Selva", guarnicao: "São Gabriel da Cachoeira/AM", label: "2BISl - Comando da 2ª Brigada de Infantaria de Selva - São Gabriel da Cachoeira/AM" },
  { value: "2GptE", sigla: "2GptE", nome: "Comando do 2º Grupamento de Engenharia", guarnicao: "Manaus/AM", label: "2GptE - Comando do 2º Grupamento de Engenharia - Manaus/AM" },
  { value: "3BIS", sigla: "3BIS", nome: "3º Batalhão de Infantaria de Selva", guarnicao: "Barcelos/AM", label: "3BIS - 3º Batalhão de Infantaria de Selva - Barcelos/AM" },
  { value: "3CFE", sigla: "3CFE", nome: "3ª Companhia de Forças Especiais", guarnicao: "Manaus/AM", label: "3CFE - 3ª Companhia de Forças Especiais - Manaus/AM" },
  { value: "4BAvEx", sigla: "4BAvEx", nome: "4º Batalhão de Aviação do Exército", guarnicao: "Manaus/AM", label: "4BAvEx - 4º Batalhão de Aviação do Exército - Manaus/AM" },
  { value: "4CGeo", sigla: "4CGeo", nome: "4º Centro de Geoinformação", guarnicao: "Manaus/AM", label: "4CGeo - 4º Centro de Geoinformação - Manaus/AM" },
  { value: "4CI", sigla: "4CI", nome: "4ª Companhia de Inteligência", guarnicao: "Manaus/AM", label: "4CI - 4ª Companhia de Inteligência - Manaus/AM" },
  { value: "4CTA", sigla: "4CTA", nome: "4º Centro de Telemática de Área", guarnicao: "Manaus/AM", label: "4CTA - 4º Centro de Telemática de Área - Manaus/AM" },
  { value: "54BIS", sigla: "54BIS", nome: "54º Batalhão de Infantaria de Selva", guarnicao: "Humaitá/AM", label: "54BIS - 54º Batalhão de Infantaria de Selva - Humaitá/AM" },
  { value: "7BPE", sigla: "7BPE", nome: "7º Batalhão de Polícia do Exército", guarnicao: "Manaus/AM", label: "7BPE - 7º Batalhão de Polícia do Exército - Manaus/AM" },
  { value: "CECMA", sigla: "CECMA", nome: "Centro de Embarcações do CMA", guarnicao: "Manaus/AM", label: "CECMA - Centro de Embarcações do CMA - Manaus/AM" },
  { value: "CFRN5BIS", sigla: "CFRN-5BIS", nome: "Comando de Fronteira Rio Negro e 5º BIS", guarnicao: "São Gabriel da Cachoeira/AM", label: "CFRN-5BIS - Comando de Fronteira Rio Negro e 5º BIS - São Gabriel da Cachoeira/AM" },
  { value: "CFS8BIS", sigla: "CFS-8BIS", nome: "Comando de Fronteira Solimões e 8º BIS", guarnicao: "Tabatinga/AM", label: "CFS-8BIS - Comando de Fronteira Solimões e 8º BIS - Tabatinga/AM" },
  { value: "CIGS", sigla: "CIGS", nome: "Centro de Instrução de Guerra na Selva", guarnicao: "Manaus/AM", label: "CIGS - Centro de Instrução de Guerra na Selva - Manaus/AM" },
  { value: "CMA", sigla: "CMA", nome: "Comando Militar da Amazônia", guarnicao: "Manaus/AM", label: "CMA - Comando Militar da Amazônia - Manaus/AM" },
  { value: "CMM", sigla: "CMM", nome: "Colégio Militar de Manaus", guarnicao: "Manaus/AM", label: "CMM - Colégio Militar de Manaus - Manaus/AM" },
  { value: "CRO12RM", sigla: "CRO-12RM", nome: "Comissão Regional de Obras da 12ª RM", guarnicao: "Manaus/AM", label: "CRO-12RM - Comissão Regional de Obras da 12ª RM - Manaus/AM" },
  { value: "HGUSGC", sigla: "HGUSGC", nome: "Hospital de Guarnição de São Gabriel da Cachoeira", guarnicao: "São Gabriel da Cachoeira/AM", label: "HGUSGC - Hospital de Guarnição de São Gabriel da Cachoeira - São Gabriel da Cachoeira/AM" },
  { value: "HMAM", sigla: "HMAM", nome: "Hospital Militar de Área de Manaus", guarnicao: "Manaus/AM", label: "HMAM - Hospital Militar de Área de Manaus - Manaus/AM" },
  { value: "PqRMnt12", sigla: "PqRMnt12", nome: "Parque Regional de Manutenção da 12ª RM", guarnicao: "Manaus/AM", label: "PqRMnt12 - Parque Regional de Manutenção da 12ª RM - Manaus/AM" },
  { value: "TG12001", sigla: "TG12001", nome: "Tiro de Guerra de Carauari", guarnicao: "Carauari/AM", label: "TG12001 - Tiro de Guerra de Carauari - Carauari/AM" },
  { value: "TG12002", sigla: "TG12002", nome: "Tiro de Guerra de Manicoré", guarnicao: "Manicoré/AM", label: "TG12002 - Tiro de Guerra de Manicoré - Manicoré/AM" },

  // Opção manual
  {
    value: "outro",
    sigla: "Outro",
    nome: "Outro (digite manualmente)",
    guarnicao: "",
    label: "Outro (digite manualmente)"
  }
];

module.exports = amazonasOMList;
