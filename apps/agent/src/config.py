from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # No hardcoded model names — required from env (LLM_MODEL / A2UI_MODEL).
    llm_model: str
    # Secondary LLM that designs dynamic A2UI surfaces (generate_a2ui tool).
    a2ui_model: str
    agent_port: int = 8123

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
