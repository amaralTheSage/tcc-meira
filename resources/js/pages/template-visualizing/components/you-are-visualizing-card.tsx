import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';

export function YouAreVisualizingCard() {
    return (
        <div className="flex w-full max-w-md flex-col gap-6">
            <Item variant="outline">
                <ItemContent>
                    <ItemTitle>You are currently visualizing a project template</ItemTitle>
                    <ItemDescription>You can create a project based on this template.</ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Button variant="outline" size="sm">
                        Action
                    </Button>
                </ItemActions>
            </Item>
        </div>
    );
}
