from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_model: str = "gpt-5.4-mini"
    # Secondary LLM that designs dynamic A2UI surfaces (generate_a2ui tool).
    a2ui_model: str = "gpt-4.1"
    agent_port: int = 8123

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
