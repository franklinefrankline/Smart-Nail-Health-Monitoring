--
-- PostgreSQL database dump
--

\restrict 7YmbtJAulGP7bUOWuaVLBj5QumsdcdqJl8TbuYgcF4igUFYKU4c4KHa2PAFxzZP

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analysis_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analysis_reports (
    id integer NOT NULL,
    user_id integer NOT NULL,
    image_path character varying(255) NOT NULL,
    health_score integer,
    risk_level character varying(50) NOT NULL,
    brightness double precision,
    contrast double precision,
    color_variation double precision,
    edge_density double precision,
    texture_score double precision,
    moisture_indicator character varying(50),
    recommendation text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT analysis_reports_health_score_check CHECK (((health_score >= 0) AND (health_score <= 100)))
);


ALTER TABLE public.analysis_reports OWNER TO postgres;

--
-- Name: analysis_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analysis_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analysis_reports_id_seq OWNER TO postgres;

--
-- Name: analysis_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analysis_reports_id_seq OWNED BY public.analysis_reports.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    role character varying(50) DEFAULT 'user'::character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: analysis_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analysis_reports ALTER COLUMN id SET DEFAULT nextval('public.analysis_reports_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: analysis_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analysis_reports (id, user_id, image_path, health_score, risk_level, brightness, contrast, color_variation, edge_density, texture_score, moisture_indicator, recommendation, created_at) FROM stdin;
1	1	4152553b-c827-4e19-8146-a3994e2cdd81_ONE.jpg	83	Low Risk	121.34	68.87	8.83	0.0298	1023.38	Normal	Your image-based indicators appear within the expected range. Continue maintaining good nail hygiene, keep nails clean and dry, and maintain a balanced diet.	2026-09-07 11:55:52.942825+05:30
2	7	uploads\\20260907133521_nail.jpg	85	Low	96.92	68.71	69.71	3.97	5.95	Low	["Nail appears dark; ensure good lighting or monitor for discoloration."]	2026-09-07 13:35:21.632843+05:30
3	2	uploads\\20260907141155_nail.jpg	85	Low	54.8	50.04	50.59	8.11	12.17	Low	["Nail appears dark; ensure good lighting or monitor for discoloration."]	2026-09-07 14:11:55.981984+05:30
4	7	uploads\\20260907151610_nail.jpg	100	Low	134.17	68.11	68.05	5.27	7.91	Normal	["Nails appear visually healthy."]	2026-09-07 15:16:11.030668+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, created_at, updated_at, role) FROM stdin;
1	Test User	test@example.com	$argon2id$v=19$m=65536,t=3,p=4$hg5+NJqIybNTZNZcJVASbg$PYMDCrwYgp9cgYypyyysXc7xBBrg23tii31ujwZNUC0	2026-09-07 11:54:32.433444+05:30	2026-09-07 11:54:32.433444+05:30	user
2	Admin	smartnailhealth@gmail.com	cP3sIJz1a3JEpx4O5amjuA==$8pEtUuCAozqk/GLiO2obbkf5aicbT+0qsnBMF9SlMPkAFtbLeTGTC/w+QNTGYyRG0lhB9/9TE80c+HL4aBwotw==	2026-09-07 11:57:12.922205+05:30	2026-09-07 11:57:12.922205+05:30	admin
7	Frankline L	frankline30999112@gmail.com	GpTngNPCH8gHhKAo3Oc9HA==$1F3sYyETDX2AQQiWedqtlkfp3zV2uTcGE8h2uIq42i4IyiMBDrfyZtEeH+Wsg/P7NJjnVw3u8v4PRiN/ms5t1g==	2026-09-07 13:34:24.769325+05:30	2026-09-07 13:34:24.769325+05:30	user
\.


--
-- Name: analysis_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analysis_reports_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: analysis_reports analysis_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analysis_reports
    ADD CONSTRAINT analysis_reports_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_reports_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_created_at ON public.analysis_reports USING btree (created_at);


--
-- Name: idx_reports_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reports_user_id ON public.analysis_reports USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: analysis_reports analysis_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analysis_reports
    ADD CONSTRAINT analysis_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 7YmbtJAulGP7bUOWuaVLBj5QumsdcdqJl8TbuYgcF4igUFYKU4c4KHa2PAFxzZP

