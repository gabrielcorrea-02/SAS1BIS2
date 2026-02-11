-- ============================================================
-- INIT.SQL — SCRIPT DE INICIALIZAÇÃO DO SISTEMA DE ENTRADA/SAÍDA
-- ============================================================


CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Organização Militar
CREATE TABLE IF NOT EXISTS organizacao_militar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    guarnicao VARCHAR(255) DEFAULT 'Manaus'
);

-- Empresa Permanente
CREATE TABLE IF NOT EXISTS empresa_permanente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(30) UNIQUE,
    nome VARCHAR(255) NOT NULL,
    setor VARCHAR(255),
    missao TEXT
);

-- Empresa Esporádica
CREATE TABLE IF NOT EXISTS empresa_esporadica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    setor VARCHAR(255)
);


-- Tipo de Visitante
CREATE TABLE IF NOT EXISTS tipo_visitante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS corpo_permanente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    nome_de_guerra VARCHAR(255),
    id_mil VARCHAR(11),
    foto BYTEA,
    foto_mimetype TEXT
);

CREATE TABLE IF NOT EXISTS veiculo_corpo_permanente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(30),
    modelo VARCHAR(30),
    cor VARCHAR(10),
    tipo VARCHAR(15),

    corpo_permanenteFK UUID REFERENCES corpo_permanente(id)
);



-- QRCode fixos
CREATE TABLE IF NOT EXISTS qrcode_fixo_visitante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INT,
    in_use BOOLEAN DEFAULT false
);

-- QRCode fixos
CREATE TABLE IF NOT EXISTS qrcode_fixo_veiculo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qrcode_fixo_visitanteFK UUID REFERENCES qrcode_fixo_visitante(id),
    number INT UNIQUE,
    in_use BOOLEAN DEFAULT false
);


-- Visitantes
CREATE TABLE IF NOT EXISTS visitantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    nome_completo VARCHAR(255) NOT NULL,
    nome_de_guerra VARCHAR(255),
    id_mil VARCHAR(11),

    objetivo TEXT,

    empresa_permanenteFK UUID REFERENCES empresa_permanente(id),
    organizacao_militarFK UUID REFERENCES organizacao_militar(id),
    empresa_esporadicaFK UUID REFERENCES empresa_esporadica(id),

    tipo_visitanteFK UUID REFERENCES tipo_visitante(id),
    qrcode_fixoFK UUID REFERENCES qrcode_fixo_visitante(id)
);


-- Veículo Esporádico
CREATE TABLE IF NOT EXISTS veiculo_esporadico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitanteFK UUID REFERENCES visitantes(id),
    qrcode_fixoFK UUID REFERENCES qrcode_fixo_veiculo(id),
    placa VARCHAR(20) UNIQUE NOT NULL,
    marca VARCHAR(30),
    modelo VARCHAR(30),
    cor VARCHAR(10),
    tipo VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS acesso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    visitanteFK UUID REFERENCES visitantes(id),
    veiculo_esporadicoFK UUID REFERENCES veiculo_esporadico(id),
    corpo_permanenteFK UUID REFERENCES corpo_permanente(id),
    veiculo_corpo_permanenteFK UUID REFERENCES veiculo_corpo_permanente(id),

    entry_time TIMESTAMP NOT NULL DEFAULT NOW(),
    exit_time TIMESTAMP,

    -- ensure exactly ONE FK is provided
    CONSTRAINT acesso_entidade_check CHECK (
        (visitanteFK IS NOT NULL AND corpo_permanenteFK IS NULL)
        OR
        (visitanteFK IS NULL AND corpo_permanenteFK IS NOT NULL)
    )
);


-- Usuário administrador padrão
INSERT INTO users (username, password, role)
VALUES (
    'admin',
    '$2b$10$chLRDXvrMMJ63paO.CvsKexx1IhB.tyvlBAS9qN1lxjXcNNOnFo0O',
    'admin'
)
ON CONFLICT (username) DO NOTHING;


INSERT INTO tipo_visitante (nome) VALUES
    ('Prestador de Serviço'),
    ('Visitante Pessoal'),
    ('Entrega'),
    ('Militar de Outra OM'),
    ('Civil Autorizado')
ON CONFLICT DO NOTHING;

INSERT INTO qrcode_fixo_visitante (number) VALUES
(1), (2), (3), (4), (5), (6), (7), (8), (9), (10)
ON CONFLICT DO NOTHING;
