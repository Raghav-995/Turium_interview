import re
from typing import List
from backend.app.core.config import settings
from backend.app.core.logging import logger


def chunk_text(
    text: str,
    chunk_size: int = settings.CHUNK_SIZE,
    chunk_overlap: int = settings.CHUNK_OVERLAP
) -> List[str]:
    """
    Splits long text into manageable, coherent chunks with overlap.
    
    Chunking Rationale:
    1. Boundary Awareness: Preserves sentences and paragraphs rather than cutting
       mid-word or mid-sentence, ensuring semantic coherence for vector embeddings.
    2. Overlap Window: An overlap of ~100 characters preserves cross-boundary context,
       so statements straddling two chunks remain complete and retrievable.
    3. Granularity: ~500 chars (approx. 70-100 words) provides optimal precision for
       inbox-style notes and articles without diluting similarity scores with irrelevant noise.
    """
    cleaned = text.strip()
    if not cleaned:
        return []

    if len(cleaned) <= chunk_size:
        return [cleaned]

    # Split text into natural semantic paragraphs / sentences
    # Split primarily by double newline, single newline, or sentence-ending punctuation
    raw_segments = re.split(r"(\n\n+|\n|\. |\? |! )", cleaned)
    
    # Recombine segments into coherent units
    units = []
    i = 0
    while i < len(raw_segments):
        unit = raw_segments[i]
        if i + 1 < len(raw_segments):
            delimiter = raw_segments[i + 1]
            unit += delimiter
            i += 2
        else:
            i += 1
        if unit.strip():
            units.append(unit)

    chunks: List[str] = []
    current_chunk = ""

    for unit in units:
        # If adding this unit keeps chunk within size limit
        if len(current_chunk) + len(unit) <= chunk_size:
            current_chunk += unit
        else:
            # Current chunk has reached target capacity
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            
            # Start next chunk with overlap from the tail of current_chunk
            if chunk_overlap > 0 and len(current_chunk) > chunk_overlap:
                overlap_text = current_chunk[-chunk_overlap:]
                # Try to snap overlap to a space boundary to avoid word chopping
                space_idx = overlap_text.find(" ")
                if space_idx != -1:
                    overlap_text = overlap_text[space_idx + 1:]
                current_chunk = overlap_text + unit
            else:
                current_chunk = unit

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    # Fallback safety: If any single chunk is excessively oversized (e.g. monolithic code or table)
    final_chunks = []
    for c in chunks:
        if len(c) > chunk_size * 2:
            # Sub-split long blocks
            for sub_i in range(0, len(c), chunk_size - chunk_overlap):
                sub_c = c[sub_i : sub_i + chunk_size].strip()
                if sub_c:
                    final_chunks.append(sub_c)
        else:
            final_chunks.append(c)

    logger.debug(f"Chunked document of {len(text)} chars into {len(final_chunks)} chunks.")
    return final_chunks
