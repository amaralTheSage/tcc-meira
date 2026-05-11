<?php

namespace App\Services\ProjectUndo;

use RuntimeException;

class ProjectUndoConflict extends RuntimeException
{
    public static function snapshotChanged(string $resource, string $id): self
    {
        return new self("Cannot undo {$resource} {$id}; expected unchanged post-action snapshot.");
    }

    public static function missingResource(string $resource, string $id): self
    {
        return new self("Cannot undo {$resource} {$id}; expected resource to exist.");
    }

    public static function existingResource(string $resource, string $id): self
    {
        return new self("Cannot restore {$resource} {$id}; expected resource to be missing.");
    }

    public static function relationChanged(string $relation, string $id): self
    {
        return new self("Cannot undo {$relation} {$id}; expected relation state to match the recorded action.");
    }
}
