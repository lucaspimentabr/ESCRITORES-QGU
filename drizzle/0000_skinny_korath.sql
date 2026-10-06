CREATE TABLE "candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"edital_id" text,
	"processo_id" text,
	"full_name" text NOT NULL,
	"initials" text,
	"birth_date" text,
	"age" integer,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"polo" text NOT NULL,
	"church" text NOT NULL,
	"jurisdiction" text,
	"pastor" text NOT NULL,
	"communion_status" text,
	"registration_date" text NOT NULL,
	"status" text DEFAULT 'EM_ANALISE' NOT NULL,
	"status_label" text DEFAULT 'Em Análise',
	"objective_score" jsonb,
	"memorial" text,
	"character_count" integer,
	"objective_questions" jsonb,
	"discursive" jsonb,
	"parecer_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disciplinas" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"codigo" text,
	"area" text NOT NULL,
	"descricao" text,
	"carga_horaria" integer DEFAULT 60,
	"professor_padrao" text,
	"modulos" jsonb,
	"turmas_ids" jsonb,
	"avaliadores" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "editais_processos" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"turma_id" text,
	"registration_url" text,
	"start_date" text,
	"end_date" text,
	"status" text DEFAULT 'Aberto' NOT NULL,
	"vagas" integer DEFAULT 30,
	"pdf_url" text,
	"etapas" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mural_avisos" (
	"id" text PRIMARY KEY NOT NULL,
	"turma_id" text NOT NULL,
	"autor_nome" text NOT NULL,
	"autor_role" text NOT NULL,
	"autor_id" text,
	"titulo" text NOT NULL,
	"conteudo" text NOT NULL,
	"data" text NOT NULL,
	"importante" boolean DEFAULT false,
	"categoria" text DEFAULT 'Geral',
	"link" text,
	"link_titulo" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"aluno_id" text NOT NULL,
	"matricula" text NOT NULL,
	"turma_id" text NOT NULL,
	"aluno_name" text NOT NULL,
	"polo" text NOT NULL,
	"frequencia_percent" integer DEFAULT 0,
	"presencas" integer DEFAULT 0,
	"aulas_totais" integer DEFAULT 0,
	"submissions" jsonb DEFAULT '[]'::jsonb,
	"notas" jsonb DEFAULT '[]'::jsonb,
	"media_geral" double precision DEFAULT 0,
	"status_academico" text DEFAULT 'Cursando' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "students_aluno_id_unique" UNIQUE("aluno_id")
);
--> statement-breakpoint
CREATE TABLE "turmas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url_slug" text NOT NULL,
	"status" text DEFAULT 'Em Andamento' NOT NULL,
	"resumo" text,
	"edital_resumo" text,
	"data_inicio_inscricoes" text,
	"data_fim_inscricoes" text,
	"data_inicio_aulas" text,
	"data_conclusao" text,
	"vagas" integer DEFAULT 30,
	"inscritos_count" integer DEFAULT 0,
	"matriculados_count" integer DEFAULT 0,
	"grade_horaria" jsonb,
	"disciplinas_ids" jsonb,
	"disciplinas_liberadas_ids" jsonb,
	"professor_ids" jsonb,
	"materiais_extras" jsonb,
	"aulas" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"whatsapp" text,
	"role" text DEFAULT 'aluno' NOT NULL,
	"role_label" text,
	"route_slug" text,
	"matricula" text,
	"polo" text,
	"campo_supervisao" text,
	"disciplina" text,
	"status" text DEFAULT 'Ativo',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
