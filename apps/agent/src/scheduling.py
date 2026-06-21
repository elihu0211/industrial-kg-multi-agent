from langchain.tools import tool
from langgraph.types import interrupt


@tool
def schedule_time(reason_for_scheduling: str, meeting_duration: int) -> str:
    """
    Schedule a meeting with the user. Presents selectable time slots in the UI and
    pauses until the user picks one (or declines). Use whenever the user wants to
    book or schedule a meeting.

    reason_for_scheduling: very brief reason, ~5 words.
    meeting_duration: meeting length in minutes.
    """
    # interrupt() pauses the run at a checkpoint and surfaces this payload to the
    # frontend as an AG-UI on_interrupt event (rendered by useInterrupt). The run
    # resumes with whatever the client passes to resolve(). Durable: the paused
    # state is checkpointed (dev/Platform server provides the checkpointer;
    # serve.py adds MemorySaver for standalone Docker), so it survives restarts.
    choice = interrupt(
        {
            "kind": "scheduleTime",
            "reasonForScheduling": reason_for_scheduling,
            "meetingDuration": meeting_duration,
        }
    )
    return f"User responded to scheduling request: {choice}"
