import Author from '../models/author'; // Adjust the import to your Author model path
import { getAuthorList, showAllAuthors } from '../pages/authors'; // Adjust the import to your function
import { Response } from 'express';
import * as authorsModule from '../pages/authors';

describe('getAuthorList', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should fetch and format the authors list correctly', async () => {
        // Define the sorted authors list as we expect it to be returned by the database
        const sortedAuthors = [
            {
                first_name: 'Jane',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: new Date('1835-11-30'),
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: new Date('1812-02-07'),
                date_of_death: new Date('1870-06-09')
            }
        ];

        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Check if the result matches the expected sorted output
        const expectedAuthors = [
            'Austen, Jane : 1775 - 1817',
            'Ghosh, Amitav : 1835 - 1910',
            'Tagore, Rabindranath : 1812 - 1870'
        ];
        expect(result).toEqual(expectedAuthors);

        // Verify that `.sort()` was called with the correct parameters
        expect(mockFind().sort).toHaveBeenCalledWith([['family_name', 'ascending']]);

    });

    it('should format fullname as empty string if first name is absent', async () => {
        // Define the sorted authors list as we expect it to be returned by the database
        const sortedAuthors = [
            {
                first_name: '',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            },
            {
                first_name: 'Amitav',
                family_name: 'Ghosh',
                date_of_birth: new Date('1835-11-30'),
                date_of_death: new Date('1910-04-21')
            },
            {
                first_name: 'Rabindranath',
                family_name: 'Tagore',
                date_of_birth: new Date('1812-02-07'),
                date_of_death: new Date('1870-06-09')
            }
        ];

        // Mock the find method to chain with sort
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        // Apply the mock directly to the Author model's `find` function
        Author.find = mockFind;

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Check if the result matches the expected sorted output
        const expectedAuthors = [
            ' : 1775 - 1817',
            'Ghosh, Amitav : 1835 - 1910',
            'Tagore, Rabindranath : 1812 - 1870'
        ];
        expect(result).toEqual(expectedAuthors);

        // Verify that `.sort()` was called with the correct parameters
        expect(mockFind().sort).toHaveBeenCalledWith([['family_name', 'ascending']]);

    });

    it('should return an empty array when an error occurs', async () => {
        // Arrange: Mock the Author.find() method to throw an error
        Author.find = jest.fn().mockImplementation(() => {
            throw new Error('Database error');
        });

        // Act: Call the function to get the authors list
        const result = await getAuthorList();

        // Assert: Verify the result is an empty array
        expect(result).toEqual([]);
    });

    it('should return lifetime with only birthdate for undefined death date', async () => {
        const sortedAuthors = [
            {
                first_name: 'Jane',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: undefined
            }
        ];
        
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(sortedAuthors)
        });

        Author.find = mockFind;
        
        const result = await getAuthorList();
        
        const expectedAuthors = ['Austen, Jane : 1775 - '];
        expect(result).toEqual(expectedAuthors);
    });
});

const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
describe('showAllAuthors', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockResponse = {
            send: jest.fn(),
        };
        mockConsoleError.mockClear();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should send author list when authors are found', async () => {
        const mockAuthors = ['Austen, Jane : 1775 - 1817'];
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([{
                first_name: 'Jane',
                family_name: 'Austen',
                date_of_birth: new Date('1775-12-16'),
                date_of_death: new Date('1817-07-18')
            }])
        });

        Author.find = mockFind;

        await showAllAuthors(mockResponse as Response);

        expect(mockResponse.send).toHaveBeenCalledWith(expect.arrayContaining(mockAuthors));
    });

    it('should send "No authors found" when author list is empty', async () => {
        // Mock the find method to return an empty array
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([])
        });

        Author.find = mockFind;

        await showAllAuthors(mockResponse as Response);

        expect(mockResponse.send).toHaveBeenCalledWith('No authors found');
    });

    it('should send "No authors found" and log error when an error occurs', async () => {
        // First create a jest spy on getAuthorList
        const getAuthorListSpy = jest.spyOn(authorsModule, 'getAuthorList');
        
        // Then make it throw an error
        getAuthorListSpy.mockImplementationOnce(() => {
            throw new Error('Processing error');
        });

        await showAllAuthors(mockResponse as Response);

        // Verify error was logged with correct message
        expect(mockConsoleError).toHaveBeenCalledWith(
            'Error processing request:',
            expect.any(Error)
        );

        // Verify correct response was sent
        expect(mockResponse.send).toHaveBeenCalledWith('No authors found');
    });
});