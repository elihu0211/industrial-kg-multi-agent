from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Standard OpenAI models. Override via LLM_MODEL / A2UI_MODEL env vars
    # (e.g. for a newer model or a custom OpenAI-compatible gateway).
    llm_model: str = "gpt-4.1"
    # Secondary LLM that designs dynamic A2UI surfaces (generate_a2ui tool).
    a2ui_model: str = "gpt-4.1"
    agent_port: int = 8123

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
